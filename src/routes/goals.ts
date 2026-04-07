import { Router, type IRouter } from "express";
import * as goalController from "../controllers/goalController";

const router: IRouter = Router();

/**
 * @swagger
 * /goals:
 *   get:
 *     tags: [Goals]
 *     summary: List all goals with filtering and sorting
 *     parameters:
 *       - in: query
 *         name: type
 *         schema:
 *           type: string
 *           enum: [saving, debt_payoff, investment, emergency_fund]
 *       - in: query
 *         name: trackingMode
 *         schema:
 *           type: string
 *           enum: [automatic, manual]
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [completed, in_progress, overdue]
 *       - in: query
 *         name: sortBy
 *         schema:
 *           type: string
 *           enum: [deadline, progressPercentage, targetAmount, createdAt]
 *       - in: query
 *         name: order
 *         schema:
 *           type: string
 *           enum: [asc, desc]
 *     responses:
 *       200:
 *         description: List of goals
 */
router.get("/goals", goalController.listGoals);

/**
 * @swagger
 * /goals:
 *   post:
 *     tags: [Goals]
 *     summary: Create a new goal
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [name, type, targetAmount, deadline, trackingMode]
 *             properties:
 *               name:
 *                 type: string
 *               type:
 *                 type: string
 *                 enum: [saving, debt_payoff, investment, emergency_fund]
 *               targetAmount:
 *                 type: number
 *               deadline:
 *                 type: string
 *                 format: date
 *               description:
 *                 type: string
 *               icon:
 *                 type: string
 *                 default: "🎯"
 *               color:
 *                 type: string
 *                 default: "#6366f1"
 *               trackingMode:
 *                 type: string
 *                 enum: [automatic, manual]
 *     responses:
 *       201:
 *         description: Goal created
 */
router.post("/goals", goalController.createGoal);

/**
 * @swagger
 * /goals/{id}:
 *   get:
 *     tags: [Goals]
 *     summary: Get single goal with details
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Goal details
 *       404:
 *         description: Goal not found
 */
router.get("/goals/:id", goalController.getGoal);

/**
 * @swagger
 * /goals/{id}:
 *   patch:
 *     tags: [Goals]
 *     summary: Update goal
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *               targetAmount:
 *                 type: number
 *               deadline:
 *                 type: string
 *                 format: date
 *               description:
 *                 type: string
 *               icon:
 *                 type: string
 *               color:
 *                 type: string
 *     responses:
 *       200:
 *         description: Goal updated
 *       404:
 *         description: Goal not found
 */
router.patch("/goals/:id", goalController.updateGoal);

/**
 * @swagger
 * /goals/{id}:
 *   delete:
 *     tags: [Goals]
 *     summary: Delete goal
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       204:
 *         description: Goal deleted
 */
router.delete("/goals/:id", goalController.deleteGoal);

/**
 * @swagger
 * /goals/{id}/asset-links:
 *   post:
 *     tags: [Goals]
 *     summary: Add asset link to goal
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [assetId]
 *             properties:
 *               assetId:
 *                 type: integer
 *               allocationPercentage:
 *                 type: number
 *                 minimum: 0
 *                 maximum: 100
 *                 default: 100
 *     responses:
 *       201:
 *         description: Asset link created
 */
router.post("/goals/:id/asset-links", goalController.addAssetLink);

/**
 * @swagger
 * /goals/{id}/asset-links/{linkId}:
 *   patch:
 *     tags: [Goals]
 *     summary: Update asset link allocation
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *       - in: path
 *         name: linkId
 *         required: true
 *         schema:
 *           type: integer
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [allocationPercentage]
 *             properties:
 *               allocationPercentage:
 *                 type: number
 *                 minimum: 0
 *                 maximum: 100
 *     responses:
 *       200:
 *         description: Asset link updated
 */
router.patch("/goals/:id/asset-links/:linkId", goalController.updateAssetLink);

/**
 * @swagger
 * /goals/{id}/asset-links/{linkId}:
 *   delete:
 *     tags: [Goals]
 *     summary: Remove asset link
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *       - in: path
 *         name: linkId
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       204:
 *         description: Asset link removed
 */
router.delete("/goals/:id/asset-links/:linkId", goalController.removeAssetLink);

/**
 * @swagger
 * /goals/{id}/contributions:
 *   post:
 *     tags: [Goals]
 *     summary: Add contribution to goal
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [amount, date]
 *             properties:
 *               amount:
 *                 type: number
 *               date:
 *                 type: string
 *                 format: date
 *               notes:
 *                 type: string
 *     responses:
 *       201:
 *         description: Contribution created
 */
router.post("/goals/:id/contributions", goalController.addContribution);

/**
 * @swagger
 * /goals/{id}/contributions/{contributionId}:
 *   patch:
 *     tags: [Goals]
 *     summary: Update contribution
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *       - in: path
 *         name: contributionId
 *         required: true
 *         schema:
 *           type: integer
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               amount:
 *                 type: number
 *               date:
 *                 type: string
 *                 format: date
 *               notes:
 *                 type: string
 *     responses:
 *       200:
 *         description: Contribution updated
 */
router.patch(
  "/goals/:id/contributions/:contributionId",
  goalController.updateContribution,
);

/**
 * @swagger
 * /goals/{id}/contributions/{contributionId}:
 *   delete:
 *     tags: [Goals]
 *     summary: Delete contribution
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *       - in: path
 *         name: contributionId
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       204:
 *         description: Contribution deleted
 */
router.delete(
  "/goals/:id/contributions/:contributionId",
  goalController.deleteContribution,
);

export default router;
