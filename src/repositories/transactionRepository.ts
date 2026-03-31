import { Request, Response } from "express";
import { db, transactionsTable, categoriesTable, assetsTable } from "../db";
import { eq, and, sql, ilike, desc, count } from "drizzle-orm";
import {
  GetTransactionsQueryParams,
  GetTransactionParams,
  UpdateTransactionParams,
  DeleteTransactionParams,
} from "../validation";
import { z } from "zod";
import { clearUserCache } from "../lib/redis";

const createTransactionSchema = z.object({
  date: z.string().regex(/^[0-9]{4}-[0-9]{2}-[0-9]{2}$/),
  description: z.string().min(1),
  amount: z.number().positive(),
  type: z.enum(["income", "expense", "transfer"]),
  categoryId: z.number().nullable().optional(),
  assetId: z.number().nullable().optional(),
  tags: z.array(z.string()).optional().default([]),
  notes: z.string().nullable().optional(),
});

const updateTransactionSchema = z.object({
  date: z
    .string()
    .regex(/^[0-9]{4}-[0-9]{2}-[0-9]{2}$/)
    .optional(),
  description: z.string().min(1).optional(),
  amount: z.number().positive().optional(),
  type: z.enum(["income", "expense", "transfer"]).optional(),
  categoryId: z.number().nullable().optional(),
  assetId: z.number().nullable().optional(),
  tags: z.array(z.string()).optional(),
  notes: z.string().nullable().optional(),
});

async function getCategoryInfo(categoryId: number | null | undefined) {
  if (!categoryId)
    return { categoryName: null, categoryColor: null, categoryIcon: null };
  const [cat] = await db
    .select()
    .from(categoriesTable)
    .where(eq(categoriesTable.id, categoryId));
  return {
    categoryName: cat?.name ?? null,
    categoryColor: cat?.color ?? null,
    categoryIcon: cat?.icon ?? null,
  };
}

/**
 * Adjust asset currentValue based on transaction type.
 * 
 * expense → money goes OUT of wallet INTO the asset → asset value INCREASES
 * transfer → same as expense (moving funds to the asset) → asset value INCREASES
 * income → money comes FROM the asset INTO wallet → asset value DECREASES
 * 
 * Pass negative `amount` to rollback a previous effect.
 */
async function adjustAssetValue(
  assetId: number,
  amount: number,
  type: string
): Promise<void> {
  // expense/transfer: buying/adding to asset → increase value
  // income: selling/withdrawing from asset → decrease value
  const delta = type === "income" ? -amount : amount;

  // Read current value first to avoid SQL type casting issues
  const [asset] = await db
    .select({ currentValue: assetsTable.currentValue })
    .from(assetsTable)
    .where(eq(assetsTable.id, assetId));

  if (!asset) return;

  const newValue = parseFloat(asset.currentValue) + delta;
  await db
    .update(assetsTable)
    .set({
      currentValue: String(newValue.toFixed(2)),
      updatedAt: new Date(),
    })
    .where(eq(assetsTable.id, assetId));
}

export async function listTransactions(req: Request, res: Response) {
  const query = GetTransactionsQueryParams.parse(req.query);
  const { month, categoryId, type, search, limit = 50, offset = 0 } = query;
  const userId = req.user!.id;

  const conditions: ReturnType<typeof eq>[] = [
    eq(transactionsTable.userId, userId),
  ];
  if (month)
    conditions.push(
      sql`to_char(${transactionsTable.date}, 'YYYY-MM') = ${month}`,
    );
  if (categoryId != null)
    conditions.push(eq(transactionsTable.categoryId, categoryId));
  if (type)
    conditions.push(
      eq(transactionsTable.type, type as "income" | "expense" | "transfer"),
    );
  if (search)
    conditions.push(ilike(transactionsTable.description, `%${search}%`));

  const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

  const [rows, totals] = await Promise.all([
    db
      .select({
        id: transactionsTable.id,
        date: transactionsTable.date,
        description: transactionsTable.description,
        amount: transactionsTable.amount,
        type: transactionsTable.type,
        categoryId: transactionsTable.categoryId,
        assetId: transactionsTable.assetId,
        tags: transactionsTable.tags,
        notes: transactionsTable.notes,
        createdAt: transactionsTable.createdAt,
        categoryName: categoriesTable.name,
        categoryColor: categoriesTable.color,
        categoryIcon: categoriesTable.icon,
        assetName: assetsTable.name,
      })
      .from(transactionsTable)
      .leftJoin(
        categoriesTable,
        eq(transactionsTable.categoryId, categoriesTable.id),
      )
      .leftJoin(
        assetsTable,
        eq(transactionsTable.assetId, assetsTable.id),
      )
      .where(whereClause)
      .orderBy(desc(transactionsTable.date), desc(transactionsTable.createdAt))
      .limit(limit ?? 50)
      .offset(offset ?? 0),
    db
      .select({
        total: count(),
        totalIncome: sql<number>`COALESCE(SUM(CASE WHEN ${transactionsTable.type} = 'income' THEN ${transactionsTable.amount}::numeric ELSE 0 END), 0)`,
        totalExpenses: sql<number>`COALESCE(SUM(CASE WHEN ${transactionsTable.type} = 'expense' THEN ${transactionsTable.amount}::numeric ELSE 0 END), 0)`,
      })
      .from(transactionsTable)
      .where(whereClause),
  ]);

  res.json({
    transactions: rows.map((r) => ({ ...r, amount: parseFloat(r.amount) })),
    total: totals[0]?.total ?? 0,
    totalIncome: parseFloat(String(totals[0]?.totalIncome ?? 0)),
    totalExpenses: parseFloat(String(totals[0]?.totalExpenses ?? 0)),
  });
}

export async function createTransaction(req: Request, res: Response): Promise<void> {
  const result = createTransactionSchema.safeParse(req.body);
  if (!result.success) {
    res
      .status(400)
      .json({ error: result.error.errors[0]?.message ?? "Validation error" });
    return;
  }
  const body = result.data;
  const userId = req.user!.id;

  const [created] = await db
    .insert(transactionsTable)
    .values({
      ...body,
      userId,
      amount: String(body.amount),
      tags: body.tags ?? [],
    })
    .returning();

  // Auto-update asset value if linked
  if (created.assetId) {
    await adjustAssetValue(created.assetId, body.amount, body.type);
  }

  const catInfo = await getCategoryInfo(created.categoryId);
  await clearUserCache(userId);
  res
    .status(201)
    .json({ ...created, amount: parseFloat(created.amount), ...catInfo });
}

export async function getTransaction(req: Request, res: Response): Promise<void> {
  const { id } = GetTransactionParams.parse(req.params);
  const userId = req.user!.id;
  const [row] = await db
    .select({
      id: transactionsTable.id,
      date: transactionsTable.date,
      description: transactionsTable.description,
      amount: transactionsTable.amount,
      type: transactionsTable.type,
      categoryId: transactionsTable.categoryId,
      assetId: transactionsTable.assetId,
      tags: transactionsTable.tags,
      notes: transactionsTable.notes,
      createdAt: transactionsTable.createdAt,
      categoryName: categoriesTable.name,
      categoryColor: categoriesTable.color,
      categoryIcon: categoriesTable.icon,
      assetName: assetsTable.name,
    })
    .from(transactionsTable)
    .leftJoin(
      categoriesTable,
      eq(transactionsTable.categoryId, categoriesTable.id),
    )
    .leftJoin(
      assetsTable,
      eq(transactionsTable.assetId, assetsTable.id),
    )
    .where(
      and(eq(transactionsTable.id, id), eq(transactionsTable.userId, userId)),
    );

  if (!row) {
    res.status(404).json({ error: "Transaction not found" });
    return;
  }
  res.json({ ...row, amount: parseFloat(row.amount) });
}

export async function updateTransaction(req: Request, res: Response): Promise<void> {
  const { id } = UpdateTransactionParams.parse(req.params);
  const userId = req.user!.id;

  const result = updateTransactionSchema.safeParse(req.body);
  if (!result.success) {
    res
      .status(400)
      .json({ error: result.error.errors[0]?.message ?? "Validation error" });
    return;
  }
  const body = result.data;

  // Fetch existing transaction before update (for asset rollback)
  const [existing] = await db
    .select()
    .from(transactionsTable)
    .where(
      and(eq(transactionsTable.id, id), eq(transactionsTable.userId, userId)),
    );

  if (!existing) {
    res.status(404).json({ error: "Transaction not found" });
    return;
  }

  const updateData: Record<string, unknown> = {};
  if (body.date !== undefined) updateData.date = body.date;
  if (body.description !== undefined) updateData.description = body.description;
  if (body.amount !== undefined) updateData.amount = String(body.amount);
  if (body.type !== undefined) updateData.type = body.type;
  if (body.categoryId !== undefined) updateData.categoryId = body.categoryId;
  if (body.assetId !== undefined) updateData.assetId = body.assetId;
  if (body.tags !== undefined) updateData.tags = body.tags;
  if (body.notes !== undefined) updateData.notes = body.notes;

  const [updated] = await db
    .update(transactionsTable)
    .set(updateData)
    .where(
      and(eq(transactionsTable.id, id), eq(transactionsTable.userId, userId)),
    )
    .returning();

  // Rollback old asset effect if the old transaction was linked to an asset
  const oldAmount = parseFloat(existing.amount);
  const oldType = existing.type;
  const oldAssetId = existing.assetId;

  const newAmount = body.amount !== undefined ? body.amount : oldAmount;
  const newType = body.type !== undefined ? body.type : oldType;
  const newAssetId = body.assetId !== undefined ? body.assetId : oldAssetId;

  // Rollback old asset
  if (oldAssetId) {
    await adjustAssetValue(oldAssetId, -oldAmount, oldType);
  }
  // Apply new asset
  if (newAssetId) {
    await adjustAssetValue(newAssetId, newAmount, newType);
  }

  const catInfo = await getCategoryInfo(updated.categoryId);
  await clearUserCache(userId);
  res.json({ ...updated, amount: parseFloat(updated.amount), ...catInfo });
}

export async function deleteTransaction(req: Request, res: Response): Promise<void> {
  const { id } = DeleteTransactionParams.parse(req.params);
  const userId = req.user!.id;
  const [deleted] = await db
    .delete(transactionsTable)
    .where(
      and(eq(transactionsTable.id, id), eq(transactionsTable.userId, userId)),
    )
    .returning();
  if (!deleted) {
    res.status(404).json({ error: "Transaction not found" });
    return;
  }

  // Rollback asset value if the deleted transaction was linked
  if (deleted.assetId) {
    const amount = parseFloat(deleted.amount);
    await adjustAssetValue(deleted.assetId, -amount, deleted.type);
  }

  await clearUserCache(userId);
  res.status(204).send();
}
