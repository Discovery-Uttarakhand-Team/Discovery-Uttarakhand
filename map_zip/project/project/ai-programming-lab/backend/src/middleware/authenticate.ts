import { NextFunction, Request, Response } from "express";
import jwt from "jsonwebtoken";
import { env } from "../config/env";
import { prisma } from "../config/prisma";
import { ApiError } from "../utils/ApiError";
import { JwtPayload } from "../types";

declare global {
    namespace Express {
        interface Request {
            user?: {
                id: string;
                email: string;
                firstName: string;
                lastName: string;
                role: string;
            };
        }
    }
}

export const authenticate = async (
    req: Request,
    _res: Response,
    next: NextFunction
): Promise<void> => {
    try {
        const authHeader = req.headers.authorization;

        if (!authHeader || !authHeader.startsWith("Bearer ")) {
            throw ApiError.unauthorized("No token provided");
        }

        const token = authHeader.split(" ")[1];

        let payload: JwtPayload;
        try {
            payload = jwt.verify(token, env.jwtSecret) as JwtPayload;
        } catch {
            throw ApiError.unauthorized("Invalid or expired token");
        }

        if (payload.type !== "access") {
            throw ApiError.unauthorized("Invalid token type");
        }

        const user = await prisma.user.findUnique({
            where: { id: payload.sub },
            select: {
                id: true,
                email: true,
                firstName: true,
                lastName: true,
                role: true,
                isActive: true,
            },
        });

        if (!user) {
            throw ApiError.unauthorized("User not found");
        }

        if (!user.isActive) {
            throw ApiError.forbidden("User account is deactivated");
        }

        req.user = user;
        next();
    } catch (error) {
        next(error);
    }
};