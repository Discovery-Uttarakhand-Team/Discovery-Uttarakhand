import request from "supertest";
import app from "../src/app";
import { prisma } from "../src/config/prisma";

const testUser = {
    email: `test.student.${Date.now()}@example.com`,
    password: "password123",
    firstName: "Test",
    lastName: "Student",
    role: "STUDENT",
    rollNumber: `ROLL${Date.now()}`,
};

describe("Authentication", () => {
    afterAll(async () => {
        // Clean up test user
        const user = await prisma.user.findUnique({
            where: { email: testUser.email },
        });
        if (user) {
            await prisma.user.delete({ where: { id: user.id } });
        }
    });

    describe("POST /api/v1/auth/register", () => {
        it("should register a new student", async () => {
            const res = await request(app)
                .post("/api/v1/auth/register")
                .send(testUser);

            expect(res.status).toBe(201);
            expect(res.body.success).toBe(true);
            expect(res.body.data.user.email).toBe(testUser.email);
            expect(res.body.data.user.role).toBe("STUDENT");
            expect(res.body.data.accessToken).toBeDefined();
            expect(res.body.data.refreshToken).toBeDefined();
        });

        it("should reject duplicate email", async () => {
            const res = await request(app)
                .post("/api/v1/auth/register")
                .send(testUser);

            expect(res.status).toBe(409);
            expect(res.body.success).toBe(false);
            expect(res.body.error.code).toBe("EMAIL_EXISTS");
        });

        it("should reject invalid email", async () => {
            const res = await request(app)
                .post("/api/v1/auth/register")
                .send({
                    ...testUser,
                    email: "invalid-email",
                    rollNumber: `ROLL${Date.now() + 1}`,
                });

            expect(res.status).toBe(400);
            expect(res.body.success).toBe(false);
        });

        it("should reject short password", async () => {
            const res = await request(app)
                .post("/api/v1/auth/register")
                .send({
                    ...testUser,
                    password: "short",
                    rollNumber: `ROLL${Date.now() + 2}`,
                });

            expect(res.status).toBe(400);
            expect(res.body.success).toBe(false);
        });
    });

    describe("POST /api/v1/auth/login", () => {
        it("should login with valid credentials", async () => {
            const res = await request(app)
                .post("/api/v1/auth/login")
                .send({
                    email: testUser.email,
                    password: testUser.password,
                });

            expect(res.status).toBe(200);
            expect(res.body.success).toBe(true);
            expect(res.body.data.user.email).toBe(testUser.email);
            expect(res.body.data.accessToken).toBeDefined();
            expect(res.body.data.refreshToken).toBeDefined();
        });

        it("should reject invalid password", async () => {
            const res = await request(app)
                .post("/api/v1/auth/login")
                .send({
                    email: testUser.email,
                    password: "wrongpassword",
                });

            expect(res.status).toBe(401);
            expect(res.body.success).toBe(false);
            expect(res.body.error.code).toBe("UNAUTHORIZED");
        });

        it("should reject non-existent email", async () => {
            const res = await request(app)
                .post("/api/v1/auth/login")
                .send({
                    email: "nonexistent@example.com",
                    password: "password123",
                });

            expect(res.status).toBe(401);
            expect(res.body.success).toBe(false);
        });
    });

    describe("GET /api/v1/auth/me", () => {
        it("should return current user with valid token", async () => {
            // Login first
            const loginRes = await request(app)
                .post("/api/v1/auth/login")
                .send({
                    email: testUser.email,
                    password: testUser.password,
                });

            const token = loginRes.body.data.accessToken;

            const res = await request(app)
                .get("/api/v1/auth/me")
                .set("Authorization", `Bearer ${token}`);

            expect(res.status).toBe(200);
            expect(res.body.success).toBe(true);
            expect(res.body.data.user.email).toBe(testUser.email);
            expect(res.body.data.user.profile).toBeDefined();
        });

        it("should reject request without token", async () => {
            const res = await request(app).get("/api/v1/auth/me");

            expect(res.status).toBe(401);
            expect(res.body.success).toBe(false);
        });

        it("should reject invalid token", async () => {
            const res = await request(app)
                .get("/api/v1/auth/me")
                .set("Authorization", "Bearer invalid-token");

            expect(res.status).toBe(401);
            expect(res.body.success).toBe(false);
        });
    });

    describe("POST /api/v1/auth/refresh", () => {
        it("should refresh tokens with valid refresh token", async () => {
            // Login first
            const loginRes = await request(app)
                .post("/api/v1/auth/login")
                .send({
                    email: testUser.email,
                    password: testUser.password,
                });

            const refreshToken = loginRes.body.data.refreshToken;

            const res = await request(app)
                .post("/api/v1/auth/refresh")
                .send({ refreshToken });

            expect(res.status).toBe(200);
            expect(res.body.success).toBe(true);
            expect(res.body.data.accessToken).toBeDefined();
            expect(res.body.data.refreshToken).toBeDefined();
        });

        it("should reject invalid refresh token", async () => {
            const res = await request(app)
                .post("/api/v1/auth/refresh")
                .send({ refreshToken: "invalid-token" });

            expect(res.status).toBe(401);
            expect(res.body.success).toBe(false);
        });
    });

    describe("POST /api/v1/auth/logout", () => {
        it("should logout successfully", async () => {
            const res = await request(app).post("/api/v1/auth/logout");

            expect(res.status).toBe(200);
            expect(res.body.success).toBe(true);
        });
    });
});