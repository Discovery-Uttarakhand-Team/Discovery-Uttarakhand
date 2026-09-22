import { Request, Response } from "express";
import { prisma } from "../config/prisma";
import { asyncHandler } from "../utils/asyncHandler";
import { sendSuccess } from "../utils/response";

export const getTeacherDashboard = asyncHandler(
    async (req: Request, res: Response) => {
        const userId = req.user!.id;

        const teacher = await prisma.teacher.findUnique({
            where: { userId },
            include: {
                classes: {
                    include: {
                        _count: {
                            select: {
                                students: true,
                                courses: true,
                            },
                        },
                    },
                },
            },
        });

        const totalStudents = teacher?.classes.reduce(
            (acc, cls) => acc + cls._count.students,
            0
        ) ?? 0;

        const totalLabs = 0;
        const totalAssignments = 0;

        sendSuccess(res, {
            teacher: {
                id: teacher?.id,
                employeeId: teacher?.employeeId,
                department: teacher?.department,
                classes: teacher?.classes.map((cls) => ({
                    id: cls.id,
                    name: cls.name,
                    code: cls.code,
                    studentCount: cls._count.students,
                    courseCount: cls._count.courses,
                })) ?? [],
            },
            stats: {
                totalStudents,
                totalClasses: teacher?.classes.length ?? 0,
                totalLabs,
                totalAssignments,
                averagePerformance: 0,
            },
            recentActivity: [],
        });
    }
);