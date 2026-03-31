import { createClient, type RedisClientType } from "redis";
import { logger } from "./logger";

export const redisUrl = process.env.REDIS_URL || "redis://localhost:6379";

let redisClient: RedisClientType | undefined;
let isConnected = false;

if (process.env.NODE_ENV !== "test") {
  redisClient = createClient({
    url: redisUrl,
  });

  redisClient.on("error", (err) => {
    logger.error({ err }, "Redis Client Error");
  });

  redisClient.on("connect", () => {
    logger.info("Redis Connecting...");
  });
}

export async function connectRedis() {
  if (redisClient && !isConnected) {
    try {
      await redisClient.connect();
      isConnected = true;
      logger.info({ redisUrl }, "Connected to Redis successfully");
    } catch (error) {
      logger.error({ error }, "Failed to connect to Redis");
    }
  }
}

export async function clearUserCache(userId: string) {
  if (!isConnected || !redisClient) return;
  try {
    // Delete all keys matching cache:userId:*
    // Note: KEYS command is generally not recommended in production for large datasets,
    // but for user-specific invalidation in a personal finance app, it's efficient enough.
    // A better approach would be using Sets or Hashes, but this is simplest for a starter.
    const keys = await redisClient.keys(`cache:${userId}:*`);
    if (keys.length > 0) {
      await redisClient.del(keys);
      logger.info({ userId, count: keys.length }, "User cache cleared");
    }
  } catch (error) {
    logger.error({ error, userId }, "Failed to clear user cache");
  }
}

export { redisClient };
