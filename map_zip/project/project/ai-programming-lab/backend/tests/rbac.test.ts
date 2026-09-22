import request from "supertest";
import app from "../src/app";
import { prisma } from "../src/config/prisma";

const timestamp = Date.now();

const studentUser = {
    email: `rbac.student.${timestamp}@example.com`,
    password: "password123",
    firstName: "RBAC",
    lastName: "Student",
    role: "STUDENT",
    rollNumber: `RBAC${timestamp}`,
};

const teacherUser = {
    email: `rbac.teacher.${timestamp}@example.com`,
    password: "password123",
    firstName: "RBAC",
    lastName: "Teacher",
    role: "TEACHER",
    employeeId: `EMP${timestamp}`,
};

const adminUser = {
    email: `rbac.admin.${timestamp}@example.com`,
    password: "password123",
    firstName: "RBAC",
    lastName: "Admin",
    role: "ADMIN",
};

async function registerUser(user: Record<string, string>) {
    const res = await request(app).post("/api/v1/auth/register").send(user);
    return res.body.data.accessToken as string;
}

describe("Role-Based Access Control", () => {
    let studentToken: string;
    let teacherToken: string;
    let adminToken: string;

    beforeAll(async () => {
        studentToken = await registerUser(studentUser);
        teacherToken = await registerUser(teacherUser);
        adminToken = await registerUser(adminUser);
    });

    afterAll(async () => {
        // Clean up test users
        const emails = [studentUser.email, teacherUser.email, adminUser.email];
        for (const email of emails) {
            const user = await prisma.user.findUnique({ where: { email } });
            if (user) {
                await prisma.user.delete({ where: { id: user.id } });
            }
        }
    });

    describe("Student access restrictions", () => {
        it("should allow student to access student routes", async () => {
            const res = await request(app)
                .get("/api/v1/student/dashboard")
                .set("Authorization", `Bearer ${studentToken}`);

            expect(res.status).toBe(200);
            expect(res.body.success).toBe(true);
        });

        it("should deny student access to teacher routes (403)", async () => {
            const res = await request(app)
                .get("/api/v1/teacher/dashboard")
                .set("Authorization", `Bearer ${studentToken}`);

            expect(res.status).toBe(403);
            expect(res.body.success).toBe(false);
            expect(res.body.error.code).toBe("FORBIDDEN");
        });

        it("should deny student access to admin routes (403)", async () => {
            const res = await request(app)
                .get("/api/v1/admin/dashboard")
                .set("Authorization", `Bearer ${studentToken}`);

            expect(res.status).toBe(403);
            expect(res.body.success).toBe(false);
            expect(res.body.error.code).toBe("FORBIDDEN");
        });
    });

    describe("Teacher access restrictions", () => {
        it("should allow teacher to access teacher routes", async () => {
            const res = await request(app)
                .get("/api/v1/teacher/dashboard")
                .set("Authorization", `Bearer ${teacherToken}`);

            expect(res.status).toBe(200);
            expect(res.body.success).toBe(true);
        });

        it("should deny teacher access to admin routes (403)", async () => {
            const res = await request(app)
                .get("/api/v1/admin/dashboard")
                .set("Authorization", `Bearer ${teacherToken}`);

            expect(res.status).toBe(403);
            expect(res.body.success).toBe(false);
            expect(res.body.error.code).toBe("FORBIDDEN");
        });
    });

    describe("Admin access", () => {
        it("should allow admin to access admin routes", async () => {
            const res = await request(app)
                .get("/api/v1/admin/dashboard")
                .set("Authorization", `Bearer ${adminToken}`);

            expect(res.status).toBe(200);
            expect(res.body.success).toBe(true);
            expect(res.body.data.stats).toBeDefined();
        });
    });

    describe("Unauthenticated access", () => {
        it("should deny access without token (401)", async () => {
            const res = await request(app).get("/api/v1/student/dashboard");

            expect(res.status).toBe(401);
            expect(res.body.success).toBe(false);
            expect(res.body.error.code).toBe("UNAUTHORIZED");
        });
    });
});