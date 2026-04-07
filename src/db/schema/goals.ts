import {
  pgTable,
  text,
  serial,
  numeric,
  timestamp,
  varchar,
  integer,
  date,
} from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";
import { assetsTable } from "./assets";

export const goalsTable = pgTable("goals", {
  id: serial("id").primaryKey(),
  userId: varchar("user_id").notNull(),
  name: text("name").notNull(),
  type: text("type", {
    enum: ["saving", "debt_payoff", "investment", "emergency_fund"],
  }).notNull(),
  targetAmount: numeric("target_amount", { precision: 15, scale: 2 }).notNull(),
  deadline: date("deadline").notNull(),
  description: text("description"),
  icon: text("icon").notNull().default("🎯"),
  color: text("color").notNull().default("#6366f1"),
  trackingMode: text("tracking_mode", {
    enum: ["automatic", "manual"],
  }).notNull(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const goalAssetLinksTable = pgTable("goal_asset_links", {
  id: serial("id").primaryKey(),
  goalId: integer("goal_id")
    .notNull()
    .references(() => goalsTable.id, { onDelete: "cascade" }),
  assetId: integer("asset_id")
    .notNull()
    .references(() => assetsTable.id, { onDelete: "cascade" }),
  allocationPercentage: numeric("allocation_percentage", {
    precision: 5,
    scale: 2,
  })
    .notNull()
    .default("100"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const goalContributionsTable = pgTable("goal_contributions", {
  id: serial("id").primaryKey(),
  goalId: integer("goal_id")
    .notNull()
    .references(() => goalsTable.id, { onDelete: "cascade" }),
  amount: numeric("amount", { precision: 15, scale: 2 }).notNull(),
  date: date("date").notNull(),
  notes: text("notes"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const insertGoalSchema = createInsertSchema(goalsTable).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});
export const insertGoalAssetLinkSchema = createInsertSchema(
  goalAssetLinksTable,
).omit({ id: true, createdAt: true });
export const insertGoalContributionSchema = createInsertSchema(
  goalContributionsTable,
).omit({ id: true, createdAt: true });

export type InsertGoal = z.infer<typeof insertGoalSchema>;
export type Goal = typeof goalsTable.$inferSelect;
export type InsertGoalAssetLink = z.infer<typeof insertGoalAssetLinkSchema>;
export type GoalAssetLink = typeof goalAssetLinksTable.$inferSelect;
export type InsertGoalContribution = z.infer<
  typeof insertGoalContributionSchema
>;
export type GoalContribution = typeof goalContributionsTable.$inferSelect;
