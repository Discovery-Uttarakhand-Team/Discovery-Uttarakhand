import request from "supertest";
import app from "../src/app";
import { prisma } from "../src/config/prisma";
import { checkRedisConnection } from "../src/config/redis";

describe("Health Endpoint", () => {
    it("should return API is running", async () => {
        const res = await request(app).get("/api/v1/health");

        expect(res.status).toBe(200);
        expect(res.body.success).toBe(true);
        expect(res.body.data.message).toBe("API is running");
    });

    it("should return 404 for unknown routes", async () => {
        const res = await request(app).get("/api/v1/unknown");

        expect(res.status).toBe(404);
        expect(res.body.success).toBe(false);
        expect(res.body.error.code).toBe("NOT_FOUND");
    });
});

describe("Database Connection", () => {
    it("should connect to the database", async () => {
        const result = await prisma.$queryRaw`SELECT 1 as connected`;
        expect(result).toBeDefined();
    });
});

describe("Redis Connection", () => {
    it("should connect to Redis", async () => {
        const connected = await checkRedisConnection();
        expect(connected).toBe(true);
    });
});