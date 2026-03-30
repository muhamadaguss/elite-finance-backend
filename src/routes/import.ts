import { Router, type IRouter } from "express";
import * as importController from "../controllers/importController";

const router: IRouter = Router();

/**
 * @swagger
 * /import/parse:
 *   post:
 *     tags: [Import]
 *     summary: Parse CSV/text import data
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [content, format]
 *             properties:
 *               content:
 *                 type: string
 *                 description: Raw CSV or plain text content
 *               format:
 *                 type: string
 *                 enum: [csv, text, auto]
 *     responses:
 *       200:
 *         description: Parsed transactions with suggestions
 */
router.post("/import/parse", importController.parseImport);

/**
 * @swagger
 * /import/confirm:
 *   post:
 *     tags: [Import]
 *     summary: Confirm and save parsed import
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [transactions]
 *             properties:
 *               transactions:
 *                 type: array
 *                 items:
 *                   type: object
 *                   properties:
 *                     date:
 *                       type: string
 *                       format: date
 *                     description:
 *                       type: string
 *                     amount:
 *                       type: number
 *                     type:
 *                       type: string
 *                       enum: [income, expense, transfer]
 *                     categoryId:
 *                       type: integer
 *                       nullable: true
 *     responses:
 *       200:
 *         description: Import result with counts
 */
router.post("/import/confirm", importController.confirmImport);

export default router;
