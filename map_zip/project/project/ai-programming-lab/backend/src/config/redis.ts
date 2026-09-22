import Redis from "ioredis";
import { env } from "./env";

export const redis = new Redis(env.redisUrl, {
    maxRetriesPerRequest: null,
    enableReadyCheck: true,
});

redis.on("connect", () => {
    console.log("✅ Redis connected");
});

redis.on("error", (err) => {
    console.error("❌ Redis error:", err.message);
});

export async function checkRedisConnection(): Promise<boolean> {
    try {
        const pong = await redis.ping();
        return pong === "PONG";
    } catch (error) {
        console.error("Redis connection check failed:", error);
        return false;
    }
}