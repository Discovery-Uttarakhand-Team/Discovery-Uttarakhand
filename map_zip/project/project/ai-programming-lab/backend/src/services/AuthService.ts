import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { Role } from "@prisma/client";
import { env } from "../config/env";
import { ApiError } from "../utils/ApiError";
import { UserService } from "./UserService";
import { JwtPayload, TokenPair } from "../types";

export class AuthService {
    private userService: UserService;

    constructor() {
        this.userService = new UserService();
    }

    async register(data: {
        email: string;
        password: string;
        firstName: string;
        lastName: string;
        role: Role;
        rollNumber?: string;
        employeeId?: string;
        department?: string;
    }) {
        const existingUser = await this.userService.findByEmail(data.email);
        if (existingUser) {
            throw ApiError.conflict("Email already registered", "EMAIL_EXISTS");
        }

        const passwordHash = await bcrypt.hash(data.password, 10);

        const user = await this.userService.createUser({
            email: data.email.toLowerCase(),
            passwordHash,
            firstName: data.firstName,
            lastName: data.lastName,
            role: data.role,
        });

        // Create role-specific profile
        switch (data.role) {
            case Role.STUDENT:
                if (!data.rollNumber) {
                    throw ApiError.badRequest("Roll number is required for students");
                }
                await this.userService.createStudentProfile(user.id, data.rollNumber);
                break;
            case Role.TEACHER:
                if (!data.employeeId) {
                    throw ApiError.badRequest("Employee ID is required for teachers");
                }
                await this.userService.createTeacherProfile(
                    user.id,
                    data.employeeId,
                    data.department
                );
                break;
            case Role.ADMIN:
                await this.userService.createAdminProfile(user.id);
                break;
        }

        const tokens = this.generateTokens(user.id, user.email, user.role);

        return {
            user: {
                id: user.id,
                email: user.email,
                firstName: user.firstName,
                lastName: user.lastName,
                role: user.role,
            },
            ...tokens,
        };
    }

    async login(email: string, password: string) {
        const user = await this.userService.findByEmail(email.toLowerCase());

        if (!user) {
            throw ApiError.unauthorized("Invalid email or password");
        }

        if (!user.isActive) {
            throw ApiError.forbidden("Account is deactivated");
        }

        const isPasswordValid = await bcrypt.compare(password, user.passwordHash);
        if (!isPasswordValid) {
            throw ApiError.unauthorized("Invalid email or password");
        }

        const tokens = this.generateTokens(user.id, user.email, user.role);

        return {
            user: {
                id: user.id,
                email: user.email,
                firstName: user.firstName,
                lastName: user.lastName,
                role: user.role,
            },
            ...tokens,
        };
    }

    async refreshToken(refreshToken: string) {
        let payload: JwtPayload;
        try {
            payload = jwt.verify(refreshToken, env.jwtRefreshSecret) as JwtPayload;
        } catch {
            throw ApiError.unauthorized("Invalid or expired refresh token");
        }

        if (payload.type !== "refresh") {
            throw ApiError.unauthorized("Invalid token type");
        }

        const user = await this.userService.findById(payload.sub);
        if (!user) {
            throw ApiError.unauthorized("User not found");
        }

        if (!user.isActive) {
            throw ApiError.forbidden("Account is deactivated");
        }

        const tokens = this.generateTokens(user.id, user.email, user.role);

        return {
            user: {
                id: user.id,
                email: user.email,
                firstName: user.firstName,
                lastName: user.lastName,
                role: user.role,
            },
            ...tokens,
        };
    }

    async getCurrentUser(userId: string) {
        const user = await this.userService.findById(userId);
        if (!user) {
            throw ApiError.unauthorized("User not found");
        }

        const profile = await this.userService.getProfileByRole(userId, user.role);

        return {
            ...user,
            profile,
        };
    }

    private generateTokens(
        userId: string,
        email: string,
        role: Role
    ): TokenPair {
        const accessToken = jwt.sign(
            {
                sub: userId,
                email,
                role,
                type: "access",
            } as JwtPayload,
            env.jwtSecret,
            { expiresIn: env.jwtExpiresIn as jwt.SignOptions["expiresIn"] }
        );

        const refreshToken = jwt.sign(
            {
                sub: userId,
                email,
                role,
                type: "refresh",
            } as JwtPayload,
            env.jwtRefreshSecret,
            { expiresIn: env.jwtRefreshExpiresIn as jwt.SignOptions["expiresIn"] }
        );

        return { accessToken, refreshToken };
    }
}