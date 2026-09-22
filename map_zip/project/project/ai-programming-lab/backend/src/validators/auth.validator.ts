import { z } from "zod";
import { Role } from "@prisma/client";

export const registerSchema = z
    .object({
        email: z.string().email("Invalid email address"),
        password: z.string().min(8, "Password must be at least 8 characters"),
        firstName: z.string().min(1, "First name is required").max(50),
        lastName: z.string().min(1, "Last name is required").max(50),
        role: z.enum([Role.STUDENT, Role.TEACHER, Role.ADMIN]),
        rollNumber: z.string().optional(),
        employeeId: z.string().optional(),
        department: z.string().optional(),
    })
    .refine(
        (data) => {
            if (data.role === Role.STUDENT && !data.rollNumber) {
                return false;
            }
            if (data.role === Role.TEACHER && !data.employeeId) {
                return false;
            }
            return true;
        },
        {
            message: "Required fields missing for the selected role",
            path: ["role"],
        }
    );

export const loginSchema = z.object({
    email: z.string().email("Invalid email address"),
    password: z.string().min(1, "Password is required"),
});

export const refreshTokenSchema = z.object({
    refreshToken: z.string().min(1, "Refresh token is required"),
});

export type RegisterInput = z.infer<typeof registerSchema>;
export type LoginInput = z.infer<typeof loginSchema>;
export type RefreshTokenInput = z.infer<typeof refreshTokenSchema>;