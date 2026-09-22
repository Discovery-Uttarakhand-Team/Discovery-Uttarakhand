import { NextFunction, Request, Response } from "express";
import { Prisma } from "@prisma/client";
import { ApiError } from "../utils/ApiError";
import { sendError } from "../utils/response";

export const notFoundHandler = (req: Request, res: Response): void => {
    sendError(res, 404, "NOT_FOUND", `Route ${req.method} ${req.originalUrl} not found`);
};

export const errorHandler = (
    err: Error | ApiError,
    _req: Request,
    res: Response,
    _next: NextFunction
): void => {
    if (err instanceof ApiError) {
        sendError(res, err.statusCode, err.code, err.message);
        return;
    }

    if (err instanceof Prisma.PrismaClientKnownRequestError) {
        const prismaError = err as Prisma.PrismaClientKnownRequestError;
        if (prismaError.code === "P2002") {
            sendError(res, 409, "DUPLICATE_ENTRY", "A record with this value already exists");
            return;
        }
        if (prismaError.code === "P2025") {
            sendError(res, 404, "NOT_FOUND", "Record not found");
            return;
        }
        sendError(res, 400, "DATABASE_ERROR", "Database operation failed");
        return;
    }

    if (err instanceof Prisma.PrismaClientValidationError) {
        sendError(res, 400, "VALIDATION_ERROR", "Invalid data provided");
        return;
    }

    console.error("Unhandled error:", err);

    sendError(res, 500, "INTERNAL_SERVER_ERROR", "Internal server error");
};