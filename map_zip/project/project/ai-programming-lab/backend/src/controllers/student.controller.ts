import { Request, Response } from "express";
import { prisma } from "../config/prisma";
import { asyncHandler } from "../utils/asyncHandler";
import { sendSuccess } from "../utils/response";

export const getStudentDashboard = asyncHandler(
    async (req: Request, res: Response) => {
        const userId = req.user!.id;

        const student = await prisma.student.findUnique({
            where: { userId },
            include: {
                classes: {
                    include: {
                        class: {
                            include: {
                                courses: true,
                            },
                        },
                    },
                },
            },
        });

        sendSuccess(res, {
            student: {
                id: student?.id,
                rollNumber: student?.rollNumber,
                classes: student?.classes.map((cs) => ({
                    id: cs.class.id,
                    name: cs.class.name,
                    code: cs.class.code,
                    courses: cs.class.courses,
                })) ?? [],
            },
            stats: {
                totalClasses: student?.classes.length ?? 0,
                totalCourses:
                    student?.classes.reduce(
                        (acc, cs) => acc + cs.class.courses.length,
                        0
                    ) ?? 0,
                problemsSolved: 0,
                assignmentsCompleted: 0,
                quizScore: 0,
                overallProgress: 0,
            },
            recentActivity: [],
            todaysFocus: null,
        });
    }
);