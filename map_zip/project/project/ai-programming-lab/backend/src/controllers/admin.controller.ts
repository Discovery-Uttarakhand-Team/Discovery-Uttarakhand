import { Request, Response } from "express";
import { prisma } from "../config/prisma";
import { asyncHandler } from "../utils/asyncHandler";
import { sendSuccess } from "../utils/response";

export const getAdminDashboard = asyncHandler(
    async (_req: Request, res: Response) => {
        const [totalStudents, totalTeachers, totalAdmins, totalClasses, totalCourses, totalTopics] =
            await Promise.all([
                prisma.student.count(),
                prisma.teacher.count(),
                prisma.admin.count(),
                prisma.class.count(),
                prisma.course.count(),
                prisma.topic.count(),
            ]);

        sendSuccess(res, {
            stats: {
                totalStudents,
                totalTeachers,
                totalAdmins,
                totalClasses,
                totalCourses,
                totalTopics,
            },
            systemActivity: [],
        });
    }
);