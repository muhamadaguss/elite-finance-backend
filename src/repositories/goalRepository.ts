import {
  db,
  goalsTable,
  goalAssetLinksTable,
  goalContributionsTable,
  assetsTable,
} from "../db";
import { eq, and, desc, sql } from "drizzle-orm";

// Task 2.1: Basic CRUD Operations

export async function createGoal(userId: string, data: any) {
  const [created] = await db
    .insert(goalsTable)
    .values({
      ...data,
      userId,
      targetAmount: String(data.targetAmount),
    })
    .returning();

  return {
    ...created,
    targetAmount: parseFloat(created.targetAmount),
  };
}

export async function getGoalById(userId: string, goalId: number) {
  const [goal] = await db
    .select()
    .from(goalsTable)
    .where(and(eq(goalsTable.id, goalId), eq(goalsTable.userId, userId)));

  if (!goal) return null;

  return {
    ...goal,
    targetAmount: parseFloat(goal.targetAmount),
  };
}

export async function listGoals(userId: string) {
  const goals = await db
    .select()
    .from(goalsTable)
    .where(eq(goalsTable.userId, userId))
    .orderBy(desc(goalsTable.createdAt));

  return goals.map((g) => ({
    ...g,
    targetAmount: parseFloat(g.targetAmount),
  }));
}

export async function updateGoal(userId: string, goalId: number, data: any) {
  const updateData: Record<string, unknown> = { updatedAt: new Date() };

  if (data.name !== undefined) updateData.name = data.name;
  if (data.description !== undefined) updateData.description = data.description;
  if (data.targetAmount !== undefined)
    updateData.targetAmount = String(data.targetAmount);
  if (data.deadline !== undefined) updateData.deadline = data.deadline;
  if (data.icon !== undefined) updateData.icon = data.icon;
  if (data.color !== undefined) updateData.color = data.color;

  const [updated] = await db
    .update(goalsTable)
    .set(updateData)
    .where(and(eq(goalsTable.id, goalId), eq(goalsTable.userId, userId)))
    .returning();

  if (!updated) return null;

  return {
    ...updated,
    targetAmount: parseFloat(updated.targetAmount),
  };
}

export async function deleteGoal(userId: string, goalId: number) {
  await db
    .delete(goalsTable)
    .where(and(eq(goalsTable.id, goalId), eq(goalsTable.userId, userId)));
}

// Task 2.2: Asset Links Management

export async function createGoalAssetLink(
  userId: string,
  goalId: number,
  assetId: number,
  allocationPercentage: number = 100,
) {
  // Validate asset ownership
  const [asset] = await db
    .select()
    .from(assetsTable)
    .where(and(eq(assetsTable.id, assetId), eq(assetsTable.userId, userId)));

  if (!asset) {
    throw new Error("Asset not found or does not belong to user");
  }

  // Validate goal ownership
  const goal = await getGoalById(userId, goalId);
  if (!goal) {
    throw new Error("Goal not found or does not belong to user");
  }

  const [created] = await db
    .insert(goalAssetLinksTable)
    .values({
      goalId,
      assetId,
      allocationPercentage: String(allocationPercentage),
    })
    .returning();

  return {
    ...created,
    allocationPercentage: parseFloat(created.allocationPercentage),
  };
}

export async function getGoalAssetLinks(goalId: number) {
  const links = await db
    .select({
      id: goalAssetLinksTable.id,
      goalId: goalAssetLinksTable.goalId,
      assetId: goalAssetLinksTable.assetId,
      allocationPercentage: goalAssetLinksTable.allocationPercentage,
      createdAt: goalAssetLinksTable.createdAt,
      assetName: assetsTable.name,
      assetType: assetsTable.type,
      assetCurrentValue: assetsTable.currentValue,
      assetCurrency: assetsTable.currency,
      assetColor: assetsTable.color,
      assetIcon: assetsTable.icon,
    })
    .from(goalAssetLinksTable)
    .innerJoin(assetsTable, eq(goalAssetLinksTable.assetId, assetsTable.id))
    .where(eq(goalAssetLinksTable.goalId, goalId));

  return links.map((link) => ({
    ...link,
    allocationPercentage: parseFloat(link.allocationPercentage),
    assetCurrentValue: parseFloat(link.assetCurrentValue),
  }));
}

export async function updateGoalAssetLink(
  userId: string,
  linkId: number,
  allocationPercentage: number,
) {
  // Validate link ownership via goal
  const [link] = await db
    .select()
    .from(goalAssetLinksTable)
    .where(eq(goalAssetLinksTable.id, linkId));

  if (!link) {
    throw new Error("Link not found");
  }

  const goal = await getGoalById(userId, link.goalId);
  if (!goal) {
    throw new Error("Goal not found or does not belong to user");
  }

  const [updated] = await db
    .update(goalAssetLinksTable)
    .set({ allocationPercentage: String(allocationPercentage) })
    .where(eq(goalAssetLinksTable.id, linkId))
    .returning();

  return {
    ...updated,
    allocationPercentage: parseFloat(updated.allocationPercentage),
  };
}

export async function deleteGoalAssetLink(userId: string, linkId: number) {
  // Validate link ownership via goal
  const [link] = await db
    .select()
    .from(goalAssetLinksTable)
    .where(eq(goalAssetLinksTable.id, linkId));

  if (!link) {
    throw new Error("Link not found");
  }

  const goal = await getGoalById(userId, link.goalId);
  if (!goal) {
    throw new Error("Goal not found or does not belong to user");
  }

  await db
    .delete(goalAssetLinksTable)
    .where(eq(goalAssetLinksTable.id, linkId));
}

export async function deleteGoalAssetLinksByAssetId(assetId: number) {
  await db
    .delete(goalAssetLinksTable)
    .where(eq(goalAssetLinksTable.assetId, assetId));
}

// Task 2.3: Contributions Management

export async function createContribution(
  userId: string,
  goalId: number,
  amount: number,
  date: string,
  notes?: string,
) {
  // Validate goal ownership
  const goal = await getGoalById(userId, goalId);
  if (!goal) {
    throw new Error("Goal not found or does not belong to user");
  }

  const [created] = await db
    .insert(goalContributionsTable)
    .values({
      goalId,
      amount: String(amount),
      date,
      notes,
    })
    .returning();

  return {
    ...created,
    amount: parseFloat(created.amount),
  };
}

export async function getContributionsByGoalId(goalId: number) {
  const contributions = await db
    .select()
    .from(goalContributionsTable)
    .where(eq(goalContributionsTable.goalId, goalId))
    .orderBy(desc(goalContributionsTable.date));

  return contributions.map((c) => ({
    ...c,
    amount: parseFloat(c.amount),
  }));
}

export async function updateContribution(
  userId: string,
  contributionId: number,
  data: any,
) {
  // Validate contribution ownership via goal
  const [contribution] = await db
    .select()
    .from(goalContributionsTable)
    .where(eq(goalContributionsTable.id, contributionId));

  if (!contribution) {
    throw new Error("Contribution not found");
  }

  const goal = await getGoalById(userId, contribution.goalId);
  if (!goal) {
    throw new Error("Goal not found or does not belong to user");
  }

  const updateData: Record<string, unknown> = {};
  if (data.amount !== undefined) updateData.amount = String(data.amount);
  if (data.date !== undefined) updateData.date = data.date;
  if (data.notes !== undefined) updateData.notes = data.notes;

  const [updated] = await db
    .update(goalContributionsTable)
    .set(updateData)
    .where(eq(goalContributionsTable.id, contributionId))
    .returning();

  return {
    ...updated,
    amount: parseFloat(updated.amount),
  };
}

export async function deleteContribution(
  userId: string,
  contributionId: number,
) {
  // Validate contribution ownership via goal
  const [contribution] = await db
    .select()
    .from(goalContributionsTable)
    .where(eq(goalContributionsTable.id, contributionId));

  if (!contribution) {
    throw new Error("Contribution not found");
  }

  const goal = await getGoalById(userId, contribution.goalId);
  if (!goal) {
    throw new Error("Goal not found or does not belong to user");
  }

  await db
    .delete(goalContributionsTable)
    .where(eq(goalContributionsTable.id, contributionId));
}

// Task 2.4: Progress Calculation Queries

export async function calculateAutomaticProgress(
  goalId: number,
): Promise<number> {
  const result = await db
    .select({
      totalProgress: sql<string>`COALESCE(SUM(
        CAST(${assetsTable.currentValue} AS NUMERIC) * 
        CAST(${goalAssetLinksTable.allocationPercentage} AS NUMERIC) / 100
      ), 0)`,
    })
    .from(goalAssetLinksTable)
    .innerJoin(assetsTable, eq(goalAssetLinksTable.assetId, assetsTable.id))
    .where(eq(goalAssetLinksTable.goalId, goalId));

  return parseFloat(result[0]?.totalProgress || "0");
}

export async function calculateManualProgress(goalId: number): Promise<number> {
  const result = await db
    .select({
      totalProgress: sql<string>`COALESCE(SUM(CAST(${goalContributionsTable.amount} AS NUMERIC)), 0)`,
    })
    .from(goalContributionsTable)
    .where(eq(goalContributionsTable.goalId, goalId));

  return parseFloat(result[0]?.totalProgress || "0");
}

export async function getGoalWithDetails(userId: string, goalId: number) {
  const goal = await getGoalById(userId, goalId);
  if (!goal) return null;

  let currentProgress = 0;
  let linkedAssets: any[] = [];
  let contributions: any[] = [];

  if (goal.trackingMode === "automatic") {
    currentProgress = await calculateAutomaticProgress(goalId);
    linkedAssets = await getGoalAssetLinks(goalId);
  } else {
    currentProgress = await calculateManualProgress(goalId);
    contributions = await getContributionsByGoalId(goalId);
  }

  return {
    ...goal,
    currentProgress,
    linkedAssets,
    contributions,
  };
}
