import { type Request, type Response, type NextFunction } from "express";
import { redisClient } from "../lib/redis";
import { logger } from "../lib/logger";

export function cacheMiddleware(ttlSeconds = 86400 * 30) {
  return async (req: Request, res: Response, next: NextFunction) => {
    // Only cache GET requests
    if (req.method !== "GET") {
      next();
      return;
    }

    // Must have an authenticated user to cache personal data
    const userId = req.user?.id;
    if (!userId) {
      next();
      return;
    }

    const key = `cache:${userId}:${req.originalUrl || req.url}`;

    try {
      if (redisClient) {
        const cachedData = await redisClient.get(key);
        if (cachedData) {
          logger.info({ key }, "Cache Hit");
          res.json(JSON.parse(cachedData));
          return;
        }
      }
    } catch (err) {
      logger.error({ err, key }, "Redis Cache Get Error");
    }

    // Hijack res.json to catch the response payload
    const originalJson = res.json.bind(res);
    res.json = (body: any) => {
      // Restore original json method to prevent memory leaks/re-entrant issues
      res.json = originalJson;

      // Only cache successful requests
      if (res.statusCode >= 200 && res.statusCode < 300 && redisClient) {
        try {
          const stringifiedBody = JSON.stringify(body);
          redisClient.setEx(key, ttlSeconds, stringifiedBody).catch((e) => {
            logger.error({ err: e, key }, "Failed to save cache to Redis");
          });
        } catch (e) {
          logger.error({ err: e, key }, "Failed to stringify cache payload");
        }
      }
      return originalJson(body);
    };

    next();
  };
}
