import { Router, type IRouter } from "express";
import multer from "multer";
import { openai } from "../integrations/openai";
import { db, transactionsTable, categoriesTable } from "../db";
import { eq } from "drizzle-orm";

const router: IRouter = Router();
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 },
});

/**
 * @swagger
 * /receipt/scan:
 *   post:
 *     tags: [Receipt]
 *     summary: Scan a receipt image (AI-powered)
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               receipt:
 *                 type: string
 *                 format: binary
 *     responses:
 *       200:
 *         description: Scanned receipt data
 *       503:
 *         description: Feature under construction
 */

/**
 * @swagger
 * /receipt/confirm:
 *   post:
 *     tags: [Receipt]
 *     summary: Confirm scanned receipt data
 *     responses:
 *       200:
 *         description: Receipt confirmed
 *       503:
 *         description: Feature under construction
 */

router.post("/receipt/scan", upload.single("receipt"), async (req, res) => {
  res
    .status(503)
    .json({
      error:
        "AI/receipt scan feature is under construction. Please check back later.",
    });
});

router.post("/receipt/confirm", async (req, res) => {
  res
    .status(503)
    .json({
      error:
        "AI/receipt confirm feature is under construction. Please check back later.",
    });
});

export default router;
