/**
 * Generated for Goals Tracking Feature
 * Do not edit manually.
 */
import type { GoalType } from "./goalType";
import type { TrackingMode } from "./trackingMode";

export interface Goal {
  id: number;
  userId: string;
  name: string;
  type: GoalType;
  targetAmount: number;
  deadline: string;
  description?: string;
  icon: string;
  color: string;
  trackingMode: TrackingMode;
  currentProgress: number;
  progressPercentage: number;
  requiredMonthlySavings: number;
  daysRemaining: number;
  status: string;
  createdAt: Date;
  updatedAt: Date;
}
