import { Request, Response } from "express";
import { prisma } from "../config/prisma";
import { checkRedisConnection } from "../config/redis";
import { asyncHandler } from "../utils/asyncHandler";
import { sendSuccess } from "../utils/response";

export const healthCheck = asyncHandler(async (_req: Request, res: Response) => {
    sendSuccess(res, {
        message: "API is running",
        timestamp: new Date().toISOString(),
    });
});

export const healthCheckDetailed = asyncHandler(
    async (_req: Request, res: Response) => {
        let databaseConnected = false;
        let redisConnected = false;

        try {
            await prisma.$queryRaw`SELECT 1`;
            databaseConnected = true;
        } catch {
            databaseConnected = false;
        }

        redisConnected = await checkRedisConnection();

        sendSuccess(res, {
            status: databaseConnected && redisConnected ? "healthy" : "degraded",
            services: {
                database: databaseConnected ? "connected" : "disconnected",
                redis: redisConnected ? "connected" : "disconnected",
            },
            timestamp: new Date().toISOString(),
        });
    }
);