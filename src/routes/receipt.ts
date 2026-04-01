import { Router, type IRouter } from "express";
import multer from "multer";
import sharp from "sharp";
import { recognizeText } from "../lib/ocr";
import { parseReceiptText } from "../lib/receiptParser";
import { db, transactionsTable } from "../db";
import { clearUserCache } from "../lib/redis";
import { logger } from "../lib/logger";
import { z } from "zod";
import { requireAuth } from "../middlewares/requireAuth";

const router: IRouter = Router();

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB
  fileFilter: (_req, file, cb) => {
    if (file.mimetype.startsWith("image/")) {
      cb(null, true);
    } else {
      cb(
        new Error(
          "Hanya file gambar yang diperbolehkan (JPEG, PNG, WebP, dll)",
        ),
      );
    }
  },
});

/**
 * Pre-process image with sharp to improve OCR accuracy:
 * - Resize to optimal size
 * - Enhance contrast for better text recognition
 * - Convert to grayscale to reduce noise
 */
async function preprocessImage(buffer: Buffer): Promise<Buffer> {
  return sharp(buffer)
    .resize({ width: 2400, withoutEnlargement: true }) // Larger for better digit recognition
    .greyscale() // Remove color
    .normalize() // Auto-adjust contrast
    .threshold(128) // Binarize image (black text on white background)
    .toFormat("png")
    .toBuffer();
}

/**
 * @swagger
 * /receipt/scan:
 *   post:
 *     tags: [Receipt]
 *     summary: Scan a receipt image using OCR (no AI key required)
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             required: [receipt]
 *             properties:
 *               receipt:
 *                 type: string
 *                 format: binary
 *                 description: Receipt image file (JPEG, PNG, WebP)
 *     responses:
 *       200:
 *         description: Scanned receipt data ready for confirmation
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 date:
 *                   type: string
 *                   example: "2026-03-31"
 *                 description:
 *                   type: string
 *                   example: "Indomaret"
 *                 amount:
 *                   type: number
 *                   example: 85000
 *                 type:
 *                   type: string
 *                   example: "expense"
 *                 confidence:
 *                   type: string
 *                   enum: [high, medium, low]
 *                 items:
 *                   type: array
 *       400:
 *         description: No image uploaded
 *       500:
 *         description: OCR processing failed
 */
router.post("/receipt/scan", upload.single("receipt"), async (req, res) => {
  if (!req.file) {
    res.status(400).json({ error: "Tidak ada file gambar yang diupload." });
    return;
  }

  logger.info(
    { filename: req.file.originalname, size: req.file.size },
    "Receipt scan started",
  );

  try {
    // 1. Pre-process the image for better OCR accuracy
    const processedBuffer = await preprocessImage(req.file.buffer);

    // 2. Run OCR
    const rawText = await recognizeText(processedBuffer);
    logger.info({ rawText: rawText.slice(0, 500) }, "OCR raw text");

    // 3. Parse the extracted text
    const parsed = parseReceiptText(rawText);

    logger.info(
      {
        merchant: parsed.description,
        amount: parsed.amount,
        date: parsed.date,
        confidence: parsed.confidence,
        itemCount: parsed.items.length,
        rawTextLength: rawText.length,
      },
      "Receipt scan completed",
    );

    // Return in the format the frontend ScanResult interface expects
    res.json({
      date: parsed.date,
      description: parsed.description,
      amount: parsed.amount,
      type: parsed.type,
      categoryId: null,
      categoryName: null,
      categoryIcon: null,
      categoryColor: null,
      items: parsed.items,
      notes: `OCR: ${rawText.slice(0, 200)}...`, // Expose raw OCR for debugging
      confidence: parsed.confidence,
    });
  } catch (err) {
    logger.error({ err }, "Receipt scan failed");
    res.status(500).json({
      error:
        "Gagal memproses gambar struk. Pastikan foto cukup jelas dan terang.",
    });
  }
});

// ─── Confirm Schema ───────────────────────────────────────────────────────────

const ConfirmReceiptBody = z.object({
  date: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, "Format tanggal harus YYYY-MM-DD"),
  description: z.string().min(1, "Deskripsi tidak boleh kosong"),
  amount: z.number().positive("Jumlah harus lebih dari 0"),
  type: z.enum(["income", "expense", "transfer"]),
  categoryId: z.number().nullable().optional(),
  notes: z.string().nullable().optional(),
});

/**
 * @swagger
 * /receipt/confirm:
 *   post:
 *     tags: [Receipt]
 *     summary: Confirm scanned receipt and save as transaction
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [date, description, amount, type]
 *             properties:
 *               date:
 *                 type: string
 *                 example: "2026-03-31"
 *               description:
 *                 type: string
 *                 example: "Indomaret"
 *               amount:
 *                 type: number
 *                 example: 85000
 *               type:
 *                 type: string
 *                 enum: [income, expense, transfer]
 *               categoryId:
 *                 type: integer
 *                 nullable: true
 *               notes:
 *                 type: string
 *                 nullable: true
 *     responses:
 *       201:
 *         description: Transaction saved successfully
 *       400:
 *         description: Validation error
 *       401:
 *         description: Unauthorized
 */
router.post("/receipt/confirm", requireAuth, async (req, res) => {
  const result = ConfirmReceiptBody.safeParse(req.body);
  if (!result.success) {
    res.status(400).json({
      error: result.error.errors[0]?.message ?? "Validasi gagal",
    });
    return;
  }

  // requireAuth middleware guarantees req.user exists
  if (!req.user) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }

  const userId = req.user.id;
  const body = result.data;

  try {
    const [created] = await db
      .insert(transactionsTable)
      .values({
        userId,
        date: body.date,
        description: body.description,
        amount: String(body.amount),
        type: body.type,
        categoryId: body.categoryId ?? null,
        assetId: null,
        tags: ["struk"], // auto-tag as receipt-originated
        notes: body.notes ?? null,
      })
      .returning();

    // Invalidate user analytics cache so dashboard reflects new transaction
    await clearUserCache(userId);

    logger.info(
      { userId, transactionId: created.id, amount: body.amount },
      "Receipt transaction saved",
    );

    res.status(201).json({
      ...created,
      amount: parseFloat(created.amount),
    });
  } catch (err) {
    logger.error({ err }, "Failed to save receipt transaction");
    res.status(500).json({ error: "Gagal menyimpan transaksi." });
  }
});

export default router;
