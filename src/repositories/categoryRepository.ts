// Category Repository
// Akses database untuk kategori

import { db, categoriesTable, transactionsTable } from "../db";
import { eq, and, sql } from "drizzle-orm";

export async function findByUserId(userId: string) {
  return db
    .select()
    .from(categoriesTable)
    .where(eq(categoriesTable.userId, userId));
}

export async function createDefaultCategories(
  userId: string,
  categories: any[],
) {
  return db
    .insert(categoriesTable)
    .values(categories.map((cat) => ({ ...cat, userId })));
}

// List categories with transaction count and parent name
export async function listCategoriesWithMeta(userId: string) {
  const cats = await db
    .select({
      id: categoriesTable.id,
      name: categoriesTable.name,
      icon: categoriesTable.icon,
      color: categoriesTable.color,
      parentId: categoriesTable.parentId,
      transactionCount: sql<number>`CAST(COUNT(${transactionsTable.id}) AS INTEGER)`,
    })
    .from(categoriesTable)
    .leftJoin(
      transactionsTable,
      and(
        eq(transactionsTable.categoryId, categoriesTable.id),
        eq(transactionsTable.userId, userId),
      ),
    )
    .where(eq(categoriesTable.userId, userId))
    .groupBy(categoriesTable.id);

  const catMap = new Map(cats.map((c) => [c.id, c.name]));
  return cats.map((c) => ({
    ...c,
    parentName: c.parentId ? (catMap.get(c.parentId) ?? null) : null,
  }));
}

// Create a new category
export async function createCategory(userId: string, data: any) {
  const [created] = await db
    .insert(categoriesTable)
    .values({ ...data, userId })
    .returning();
  return { ...created, transactionCount: 0, parentName: null };
}

// Update a category
export async function updateCategory(
  userId: string,
  id: string,
  updateData: Record<string, unknown>,
) {
  const [updated] = await db
    .update(categoriesTable)
    .set(updateData)
    .where(and(eq(categoriesTable.id, Number(id)), eq(categoriesTable.userId, userId)))
    .returning();
  if (!updated) return null;
  return { ...updated, transactionCount: 0, parentName: null };
}

// Delete a category
export async function deleteCategory(userId: string, id: string) {
  await db
    .delete(categoriesTable)
    .where(and(eq(categoriesTable.id, Number(id)), eq(categoriesTable.userId, userId)));
  return;
}
