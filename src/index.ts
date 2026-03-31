import app from "./app";
import { logger } from "./lib/logger";
import { connectRedis } from "./lib/redis";
import { terminateOcr } from "./lib/ocr";

const rawPort = process.env["PORT"];

if (!rawPort) {
  throw new Error(
    "PORT environment variable is required but was not provided.",
  );
}

const port = Number(rawPort);

if (Number.isNaN(port) || port <= 0) {
  throw new Error(`Invalid PORT value: "${rawPort}"`);
}

// Connect to Redis before starting the server
await connectRedis();

const server = app.listen(port, (err) => {
  if (err) {
    logger.error({ err }, "Error listening on port");
    process.exit(1);
  }

  logger.info({ port }, "Server listening");
});

// Graceful shutdown: release Tesseract worker & Redis client
process.on("SIGTERM", async () => {
  logger.info("SIGTERM received, shutting down gracefully...");
  server.close();
  await terminateOcr();
  process.exit(0);
});

process.on("SIGINT", async () => {
  logger.info("SIGINT received, shutting down gracefully...");
  server.close();
  await terminateOcr();
  process.exit(0);
});
