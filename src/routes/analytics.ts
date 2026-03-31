import { Router, type IRouter } from "express";
import * as analyticsController from "../controllers/analyticsController";
import { cacheMiddleware } from "../middlewares/cacheMiddleware";

const router: IRouter = Router();

// Apply a long TTL (30 days = 2592000 seconds) since we manage cache invalidation manually anyway
const analyticsCache = cacheMiddleware(2592000);

/**
 * @swagger
 * /analytics/monthly-summary:
 *   get:
 *     tags: [Analytics]
 *     summary: Get monthly summary
 *     parameters:
 *       - in: query
 *         name: month
 *         required: true
 *         schema:
 *           type: string
 *         description: "Month in YYYY-MM format"
 *     responses:
 *       200:
 *         description: Monthly summary with income, expenses, savings, and top categories
 */
router.get(
  "/analytics/monthly-summary",
  analyticsCache,
  analyticsController.getMonthlySummary,
);

/**
 * @swagger
 * /analytics/spending-by-category:
 *   get:
 *     tags: [Analytics]
 *     summary: Get spending breakdown by category
 *     parameters:
 *       - in: query
 *         name: month
 *         required: true
 *         schema:
 *           type: string
 *         description: "Month in YYYY-MM format"
 *     responses:
 *       200:
 *         description: Spending breakdown per category
 */
router.get(
  "/analytics/spending-by-category",
  analyticsCache,
  analyticsController.getSpendingByCategory,
);

/**
 * @swagger
 * /analytics/monthly-trend:
 *   get:
 *     tags: [Analytics]
 *     summary: Get monthly income/expense trend
 *     parameters:
 *       - in: query
 *         name: months
 *         schema:
 *           type: integer
 *           default: 12
 *         description: Number of months to look back
 *     responses:
 *       200:
 *         description: Monthly income/expense trend data
 */
router.get(
  "/analytics/monthly-trend",
  analyticsCache,
  analyticsController.getMonthlyTrend,
);

export default router;
