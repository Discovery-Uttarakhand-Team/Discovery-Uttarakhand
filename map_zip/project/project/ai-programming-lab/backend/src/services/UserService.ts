import { Role } from "@prisma/client";
import { prisma } from "../config/prisma";
import { ApiError } from "../utils/ApiError";

export class UserService {
    async findByEmail(email: string) {
        return prisma.user.findUnique({
            where: { email },
        });
    }

    async findById(id: string) {
        return prisma.user.findUnique({
            where: { id },
            select: {
                id: true,
                email: true,
                firstName: true,
                lastName: true,
                role: true,
                isActive: true,
                createdAt: true,
                updatedAt: true,
            },
        });
    }

    async createUser(data: {
        email: string;
        passwordHash: string;
        firstName: string;
        lastName: string;
        role: Role;
    }) {
        return prisma.user.create({
            data,
        });
    }

    async createStudentProfile(userId: string, rollNumber: string) {
        return prisma.student.create({
            data: {
                userId,
                rollNumber,
            },
        });
    }

    async createTeacherProfile(
        userId: string,
        employeeId: string,
        department?: string
    ) {
        return prisma.teacher.create({
            data: {
                userId,
                employeeId,
                department,
            },
        });
    }

    async createAdminProfile(userId: string) {
        return prisma.admin.create({
            data: {
                userId,
            },
        });
    }

    async getStudentProfile(userId: string) {
        return prisma.student.findUnique({
            where: { userId },
            include: {
                user: {
                    select: {
                        id: true,
                        email: true,
                        firstName: true,
                        lastName: true,
                        role: true,
                    },
                },
            },
        });
    }

    async getTeacherProfile(userId: string) {
        return prisma.teacher.findUnique({
            where: { userId },
            include: {
                user: {
                    select: {
                        id: true,
                        email: true,
                        firstName: true,
                        lastName: true,
                        role: true,
                    },
                },
            },
        });
    }

    async getAdminProfile(userId: string) {
        return prisma.admin.findUnique({
            where: { userId },
            include: {
                user: {
                    select: {
                        id: true,
                        email: true,
                        firstName: true,
                        lastName: true,
                        role: true,
                    },
                },
            },
        });
    }

    async getProfileByRole(userId: string, role: Role) {
        switch (role) {
            case Role.STUDENT:
                return this.getStudentProfile(userId);
            case Role.TEACHER:
                return this.getTeacherProfile(userId);
            case Role.ADMIN:
                return this.getAdminProfile(userId);
            default:
                throw ApiError.badRequest("Invalid role");
        }
    }
}