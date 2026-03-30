import { Router, type IRouter } from "express";
import * as assetController from "../controllers/assetController";

const router: IRouter = Router();

/**
 * @swagger
 * /assets:
 *   get:
 *     tags: [Assets]
 *     summary: List all assets
 *     responses:
 *       200:
 *         description: List of assets
 */
router.get("/assets", assetController.listAssets);

/**
 * @swagger
 * /assets:
 *   post:
 *     tags: [Assets]
 *     summary: Create an asset
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [name, type, currentValue]
 *             properties:
 *               name:
 *                 type: string
 *               type:
 *                 type: string
 *                 enum: [cash, investment, property, crypto, other]
 *               currentValue:
 *                 type: number
 *               currency:
 *                 type: string
 *                 default: USD
 *               color:
 *                 type: string
 *                 default: "#6366f1"
 *               icon:
 *                 type: string
 *                 default: "💵"
 *     responses:
 *       201:
 *         description: Asset created
 */
router.post("/assets", assetController.createAsset);

/**
 * @swagger
 * /assets/{id}:
 *   patch:
 *     tags: [Assets]
 *     summary: Update an asset
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
 *               currentValue:
 *                 type: number
 *               color:
 *                 type: string
 *               icon:
 *                 type: string
 *     responses:
 *       200:
 *         description: Asset updated
 *       404:
 *         description: Asset not found
 */
router.patch("/assets/:id", assetController.updateAsset);

/**
 * @swagger
 * /assets/{id}:
 *   delete:
 *     tags: [Assets]
 *     summary: Delete an asset
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       204:
 *         description: Asset deleted
 */
router.delete("/assets/:id", assetController.deleteAsset);

/**
 * @swagger
 * /assets/net-worth-history:
 *   get:
 *     tags: [Assets]
 *     summary: Get net worth history
 *     responses:
 *       200:
 *         description: Net worth history with breakdown
 */
router.get("/assets/net-worth-history", assetController.getNetWorthHistory);

export default router;
