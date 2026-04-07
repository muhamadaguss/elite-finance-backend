import { Request, Response } from "express";
import * as goalRepository from "../repositories/goalRepository";
import { clearUserCache } from "../lib/redis";

// Task 3.2: Progress Calculation Helpers

export function calculateProgressPercentage(
  currentProgress: number,
  targetAmount: number,
): number {
  if (targetAmount === 0) return 0;
  return (currentProgress / targetAmount) * 100;
}

export function calculateRequiredMonthlySavings(
  targetAmount: number,
  currentProgress: number,
  deadline: string,
): number {
  const remaining = targetAmount - currentProgress;
  if (remaining <= 0) return 0;

  const deadlineDate = new Date(deadline);
  const now = new Date();

  if (deadlineDate <= now) return 0;

  const monthsRemaining = Math.max(
    1,
    (deadlineDate.getFullYear() - now.getFullYear()) * 12 +
      (deadlineDate.getMonth() - now.getMonth()),
  );

  return Math.round((remaining / monthsRemaining) * 100) / 100;
}

export function calculateDaysRemaining(deadline: string): number {
  const deadlineDate = new Date(deadline);
  const now = new Date();
  const diffTime = deadlineDate.getTime() - now.getTime();
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
}

export function determineGoalStatus(
  progressPercentage: number,
  daysRemaining: number,
): string {
  if (progressPercentage >= 100) return "completed";
  if (daysRemaining < 0) return "overdue";
  return "in_progress";
}

function enrichGoalWithCalculations(goal: any, currentProgress: number) {
  const progressPercentage = calculateProgressPercentage(
    currentProgress,
    goal.targetAmount,
  );
  const requiredMonthlySavings = calculateRequiredMonthlySavings(
    goal.targetAmount,
    currentProgress,
    goal.deadline,
  );
  const daysRemaining = calculateDaysRemaining(goal.deadline);
  const status = determineGoalStatus(progressPercentage, daysRemaining);

  return {
    ...goal,
    currentProgress,
    progressPercentage,
    requiredMonthlySavings,
    daysRemaining,
    status,
  };
}

// Task 3.1: Core Operations

export async function createGoal(req: Request, res: Response) {
  try {
    const userId = req.user!.id;
    const body = req.body;

    // Validate required fields
    if (
      !body.name ||
      !body.type ||
      !body.targetAmount ||
      !body.deadline ||
      !body.trackingMode
    ) {
      res.status(400).json({ error: "Missing required fields" });
      return;
    }

    // Validate target amount
    if (body.targetAmount <= 0) {
      res
        .status(400)
        .json({ error: "Target amount must be greater than zero" });
      return;
    }

    // Validate deadline is future date
    const deadlineDate = new Date(body.deadline);
    if (deadlineDate <= new Date()) {
      res.status(400).json({ error: "Deadline must be a future date" });
      return;
    }

    // Validate goal type
    const validTypes = [
      "saving",
      "debt_payoff",
      "investment",
      "emergency_fund",
    ];
    if (!validTypes.includes(body.type)) {
      res.status(400).json({ error: "Invalid goal type" });
      return;
    }

    // Validate tracking mode
    const validModes = ["automatic", "manual"];
    if (!validModes.includes(body.trackingMode)) {
      res.status(400).json({ error: "Invalid tracking mode" });
      return;
    }

    const created = await goalRepository.createGoal(userId, body);
    await clearUserCache(userId);

    const enriched = enrichGoalWithCalculations(created, 0);
    res.status(201).json(enriched);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
}

export async function getGoal(req: Request, res: Response) {
  try {
    const userId = req.user!.id;
    const goalId = parseInt(String(req.params.id), 10);

    const goalWithDetails = await goalRepository.getGoalWithDetails(
      userId,
      goalId,
    );
    if (!goalWithDetails) {
      res.status(404).json({ error: "Goal not found" });
      return;
    }

    const enriched = enrichGoalWithCalculations(
      goalWithDetails,
      goalWithDetails.currentProgress,
    );
    res.json(enriched);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
}

export async function listGoals(req: Request, res: Response) {
  try {
    const userId = req.user!.id;
    const goals = await goalRepository.listGoals(userId);

    // Calculate progress for each goal
    const enrichedGoals = await Promise.all(
      goals.map(async (goal) => {
        let currentProgress = 0;
        if (goal.trackingMode === "automatic") {
          currentProgress = await goalRepository.calculateAutomaticProgress(
            goal.id,
          );
        } else {
          currentProgress = await goalRepository.calculateManualProgress(
            goal.id,
          );
        }
        return enrichGoalWithCalculations(goal, currentProgress);
      }),
    );

    // Apply filters
    let filtered = enrichedGoals;

    if (req.query.type) {
      filtered = filtered.filter((g) => g.type === req.query.type);
    }

    if (req.query.trackingMode) {
      filtered = filtered.filter(
        (g) => g.trackingMode === req.query.trackingMode,
      );
    }

    if (req.query.status) {
      filtered = filtered.filter((g) => g.status === req.query.status);
    }

    // Apply sorting
    if (req.query.sortBy) {
      const sortBy = req.query.sortBy as string;
      const order = req.query.order === "asc" ? 1 : -1;

      filtered.sort((a: any, b: any) => {
        if (a[sortBy] < b[sortBy]) return -1 * order;
        if (a[sortBy] > b[sortBy]) return 1 * order;
        return 0;
      });
    }

    res.json(filtered);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
}

export async function updateGoal(req: Request, res: Response) {
  try {
    const userId = req.user!.id;
    const goalId = parseInt(String(req.params.id), 10);
    const body = req.body;

    // Prevent changing type and trackingMode
    if (body.type !== undefined) {
      res.status(400).json({ error: "Cannot change goal type after creation" });
      return;
    }

    if (body.trackingMode !== undefined) {
      res
        .status(400)
        .json({ error: "Cannot change tracking mode after creation" });
      return;
    }

    // Validate target amount if provided
    if (body.targetAmount !== undefined && body.targetAmount <= 0) {
      res
        .status(400)
        .json({ error: "Target amount must be greater than zero" });
      return;
    }

    // Validate deadline if provided
    if (body.deadline !== undefined) {
      const deadlineDate = new Date(body.deadline);
      if (deadlineDate <= new Date()) {
        res.status(400).json({ error: "Deadline must be a future date" });
        return;
      }
    }

    const updated = await goalRepository.updateGoal(userId, goalId, body);
    if (!updated) {
      res.status(404).json({ error: "Goal not found" });
      return;
    }

    await clearUserCache(userId);

    // Get current progress
    let currentProgress = 0;
    if (updated.trackingMode === "automatic") {
      currentProgress = await goalRepository.calculateAutomaticProgress(goalId);
    } else {
      currentProgress = await goalRepository.calculateManualProgress(goalId);
    }

    const enriched = enrichGoalWithCalculations(updated, currentProgress);
    res.json(enriched);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
}

export async function deleteGoal(req: Request, res: Response) {
  try {
    const userId = req.user!.id;
    const goalId = parseInt(String(req.params.id), 10);

    await goalRepository.deleteGoal(userId, goalId);
    await clearUserCache(userId);
    res.status(204).send();
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
}

// Task 3.3: Asset Links Management

export async function addAssetLink(req: Request, res: Response) {
  try {
    const userId = req.user!.id;
    const goalId = parseInt(String(req.params.id), 10);
    const { assetId, allocationPercentage = 100 } = req.body;

    // Validate goal exists and has automatic tracking
    const goal = await goalRepository.getGoalById(userId, goalId);
    if (!goal) {
      res.status(404).json({ error: "Goal not found" });
      return;
    }

    if (goal.trackingMode !== "automatic") {
      res.status(400).json({
        error: "Can only add asset links to automatic tracking goals",
      });
      return;
    }

    // Validate allocation percentage
    if (allocationPercentage < 0 || allocationPercentage > 100) {
      res
        .status(400)
        .json({ error: "Allocation percentage must be between 0 and 100" });
      return;
    }

    const created = await goalRepository.createGoalAssetLink(
      userId,
      goalId,
      assetId,
      allocationPercentage,
    );

    await clearUserCache(userId);
    res.status(201).json(created);
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
}

export async function updateAssetLink(req: Request, res: Response) {
  try {
    const userId = req.user!.id;
    const linkId = parseInt(String(req.params.linkId), 10);
    const { allocationPercentage } = req.body;

    // Validate allocation percentage
    if (allocationPercentage < 0 || allocationPercentage > 100) {
      res
        .status(400)
        .json({ error: "Allocation percentage must be between 0 and 100" });
      return;
    }

    const updated = await goalRepository.updateGoalAssetLink(
      userId,
      linkId,
      allocationPercentage,
    );
    await clearUserCache(userId);
    res.json(updated);
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
}

export async function removeAssetLink(req: Request, res: Response) {
  try {
    const userId = req.user!.id;
    const linkId = parseInt(String(req.params.linkId), 10);

    await goalRepository.deleteGoalAssetLink(userId, linkId);
    await clearUserCache(userId);
    res.status(204).send();
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
}

// Task 3.4: Contributions Management

export async function addContribution(req: Request, res: Response) {
  try {
    const userId = req.user!.id;
    const goalId = parseInt(String(req.params.id), 10);
    const { amount, date, notes } = req.body;

    // Validate goal exists and has manual tracking
    const goal = await goalRepository.getGoalById(userId, goalId);
    if (!goal) {
      res.status(404).json({ error: "Goal not found" });
      return;
    }

    if (goal.trackingMode !== "manual") {
      res
        .status(400)
        .json({ error: "Can only add contributions to manual tracking goals" });
      return;
    }

    // Validate date
    if (!date) {
      res.status(400).json({ error: "Date is required" });
      return;
    }

    const created = await goalRepository.createContribution(
      userId,
      goalId,
      amount,
      date,
      notes,
    );
    await clearUserCache(userId);
    res.status(201).json(created);
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
}

export async function updateContribution(req: Request, res: Response) {
  try {
    const userId = req.user!.id;
    const contributionId = parseInt(String(req.params.contributionId), 10);
    const body = req.body;

    const updated = await goalRepository.updateContribution(
      userId,
      contributionId,
      body,
    );
    await clearUserCache(userId);
    res.json(updated);
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
}

export async function deleteContribution(req: Request, res: Response) {
  try {
    const userId = req.user!.id;
    const contributionId = parseInt(String(req.params.contributionId), 10);

    await goalRepository.deleteContribution(userId, contributionId);
    await clearUserCache(userId);
    res.status(204).send();
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
}
