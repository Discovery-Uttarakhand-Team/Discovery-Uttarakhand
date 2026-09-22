import { NextFunction, Request, Response } from "express";
import { ZodSchema } from "zod";
import { ApiError } from "../utils/ApiError";

export const validate = (schema: ZodSchema) => {
    return (req: Request, _res: Response, next: NextFunction): void => {
        const result = schema.safeParse(req.body);

        if (!result.success) {
            const firstError = result.error.errors[0];
            next(
                ApiError.badRequest(
                    firstError?.message || "Validation failed",
                    "VALIDATION_ERROR",
                    result.error.errors
                )
            );
            return;
        }

        req.body = result.data;
        next();
    };
};