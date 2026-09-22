import app from "./app";
import { env } from "./config/env";
import { prisma } from "./config/prisma";
import { redis } from "./config/redis";

const startServer = async () => {
    try {
        // Test database connection
        await prisma.$queryRaw`SELECT 1`;
        console.log("✅ Database connected");

        // Test Redis connection
        await redis.ping();
        console.log("✅ Redis connected");

        app.listen(env.port, () => {
            console.log(`🚀 Server running on port ${env.port}`);
            console.log(`📚 Environment: ${env.nodeEnv}`);
        });
    } catch (error) {
        console.error("❌ Failed to start server:", error);
        process.exit(1);
    }
};

// Graceful shutdown
const shutdown = async () => {
    console.log("🛑 Shutting down gracefully...");
    await prisma.$disconnect();
    await redis.quit();
    process.exit(0);
};

process.on("SIGINT", shutdown);
process.on("SIGTERM", shutdown);

startServer();