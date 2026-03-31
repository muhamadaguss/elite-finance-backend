import { createWorker, type Worker } from "tesseract.js";
import { logger } from "./logger";

let worker: Worker | null = null;
let isInitializing = false;

/**
 * Returns a shared singleton Tesseract worker.
 * Supports Indonesian (ind) + English (eng) so it can handle
 * mixed-language receipts common in Indonesia.
 */
async function getWorker(): Promise<Worker> {
  if (worker) return worker;

  if (isInitializing) {
    // Wait until initialization completes (polling)
    await new Promise<void>((resolve) => {
      const interval = setInterval(() => {
        if (!isInitializing) {
          clearInterval(interval);
          resolve();
        }
      }, 100);
    });
    return worker!;
  }

  isInitializing = true;
  logger.info("Initializing Tesseract OCR worker...");

  try {
    worker = await createWorker("ind+eng", 1, {
      logger: (m) => {
        if (m.status === "recognizing text") {
          logger.debug({ progress: Math.round(m.progress * 100) }, "OCR progress");
        }
      },
    });

    logger.info("Tesseract OCR worker ready");
  } finally {
    isInitializing = false;
  }

  return worker!;
}

/**
 * Runs OCR on a given image buffer and returns the raw text.
 */
export async function recognizeText(imageBuffer: Buffer): Promise<string> {
  const w = await getWorker();
  const { data } = await w.recognize(imageBuffer);
  return data.text;
}

/**
 * Terminate the worker gracefully on app shutdown.
 */
export async function terminateOcr(): Promise<void> {
  if (worker) {
    await worker.terminate();
    worker = null;
    logger.info("Tesseract OCR worker terminated");
  }
}
