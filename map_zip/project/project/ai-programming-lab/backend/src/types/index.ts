import { Role } from "@prisma/client";

export interface AuthUser {
    id: string;
    email: string;
    firstName: string;
    lastName: string;
    role: Role;
}

export interface JwtPayload {
    sub: string;
    email: string;
    role: Role;
    type: "access" | "refresh";
}

export interface ApiResponse<T = unknown> {
    success: boolean;
    data?: T;
    error?: {
        code: string;
        message: string;
    };
}

export interface RegisterInput {
    email: string;
    password: string;
    firstName: string;
    lastName: string;
    role: Role;
    rollNumber?: string;
    employeeId?: string;
    department?: string;
}

export interface LoginInput {
    email: string;
    password: string;
}

export interface TokenPair {
    accessToken: string;
    refreshToken: string;
}