import { NextFunction, Request, Response } from "express";
import { Role } from "@prisma/client";
import { ApiError } from "../utils/ApiError";

export const requireRole = (...roles: Role[]) => {
    return (req: Request, _res: Response, next: NextFunction): void => {
        if (!req.user) {
            next(ApiError.unauthorized("Authentication required"));
            return;
        }

        if (!roles.includes(req.user.role as Role)) {
            next(
                ApiError.forbidden(
                    "You do not have permission to access this resource"
                )
            );
            return;
        }

        next();
    };
};