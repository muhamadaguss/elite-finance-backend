import { sql } from "drizzle-orm";
// Net worth history logic
export async function getNetWorthHistory(userId: string) {
  const rows = await db
    .select({
      date: sql<string>`to_char(${assetHistoryTable.recordedAt}, 'YYYY-MM-DD')`,
      assetId: assetHistoryTable.assetId,
      value: assetHistoryTable.value,
      assetName: assetsTable.name,
    })
    .from(assetHistoryTable)
    .innerJoin(
      assetsTable,
      and(
        eq(assetHistoryTable.assetId, assetsTable.id),
        eq(assetsTable.userId, userId),
      ),
    )
    .orderBy(sql`to_char(${assetHistoryTable.recordedAt}, 'YYYY-MM-DD') ASC`);

  const byDate = new Map<
    string,
    { netWorth: number; breakdown: Record<string, number> }
  >();
  for (const row of rows) {
    if (!byDate.has(row.date)) {
      byDate.set(row.date, { netWorth: 0, breakdown: {} });
    }
    const entry = byDate.get(row.date)!;
    const val = parseFloat(String(row.value));
    entry.netWorth += val;
    entry.breakdown[row.assetName ?? `Asset ${row.assetId}`] = val;
  }

  if (byDate.size === 0) {
    const assets = await db
      .select()
      .from(assetsTable)
      .where(eq(assetsTable.userId, userId));
    if (assets.length > 0) {
      const today = new Date().toISOString().split("T")[0];
      const netWorth = assets.reduce(
        (sum, a) => sum + parseFloat(a.currentValue),
        0,
      );
      const breakdown: Record<string, number> = {};
      for (const a of assets) breakdown[a.name] = parseFloat(a.currentValue);
      byDate.set(today, { netWorth, breakdown });
    }
  }

  return Array.from(byDate.entries()).map(([date, data]) => ({
    date,
    netWorth: data.netWorth,
    breakdown: data.breakdown,
  }));
}
import { db, assetsTable, assetHistoryTable } from "../db";
import { eq, and, desc } from "drizzle-orm";

export async function listAssets(userId: string) {
  const assets = await db
    .select()
    .from(assetsTable)
    .where(eq(assetsTable.userId, userId))
    .orderBy(desc(assetsTable.updatedAt));
  return assets.map((a) => ({
    ...a,
    currentValue: parseFloat(a.currentValue),
  }));
}

export async function createAsset(userId: string, data: any) {
  const [created] = await db
    .insert(assetsTable)
    .values({ ...data, userId, currentValue: String(data.currentValue) })
    .returning();

  await db.insert(assetHistoryTable).values({
    assetId: created.id,
    value: created.currentValue,
  });

  return { ...created, currentValue: parseFloat(created.currentValue) };
}

export async function updateAsset(userId: string, id: string, body: any) {
  const updateData: Record<string, unknown> = { updatedAt: new Date() };
  if (body.name !== undefined) updateData.name = body.name;
  if (body.currentValue !== undefined)
    updateData.currentValue = String(body.currentValue);
  if (body.color !== undefined) updateData.color = body.color;
  if (body.icon !== undefined) updateData.icon = body.icon;

  const assetId = typeof id === "string" ? parseInt(id, 10) : id;

  const [updated] = await db
    .update(assetsTable)
    .set(updateData)
    .where(and(eq(assetsTable.id, assetId), eq(assetsTable.userId, userId)))
    .returning();

  if (!updated) return null;

  if (body.currentValue !== undefined) {
    await db.insert(assetHistoryTable).values({
      assetId: updated.id,
      value: updated.currentValue,
    });
  }

  return { ...updated, currentValue: parseFloat(updated.currentValue) };
}

export async function deleteAsset(userId: string, id: string) {
  const assetId = typeof id === "string" ? parseInt(id, 10) : id;
  await db
    .delete(assetsTable)
    .where(and(eq(assetsTable.id, assetId), eq(assetsTable.userId, userId)));
  return;
}
