import dotenv from "dotenv";
import path from "path";

dotenv.config({ path: path.resolve(__dirname, "../../.env") });

export const env = {
    nodeEnv: process.env.NODE_ENV || "development",
    port: parseInt(process.env.PORT || "5000", 10),
    clientUrl: process.env.CLIENT_URL || "http://localhost:5173",

    databaseUrl: process.env.DATABASE_URL || "",

    jwtSecret: process.env.JWT_SECRET || "",
    jwtRefreshSecret: process.env.JWT_REFRESH_SECRET || "",
    jwtExpiresIn: process.env.JWT_EXPIRES_IN || "15m",
    jwtRefreshExpiresIn: process.env.JWT_REFRESH_EXPIRES_IN || "7d",

    redisUrl: process.env.REDIS_URL || "redis://localhost:6379",

    aiProvider: process.env.AI_PROVIDER || "openai",
    aiApiKey: process.env.AI_API_KEY || "",
    aiModel: process.env.AI_MODEL || "gpt-4o-mini",

    aiServiceUrl: process.env.AI_SERVICE_URL || "http://localhost:8000",
    codeExecutorUrl: process.env.CODE_EXECUTOR_URL || "http://localhost:4000",
} as const;