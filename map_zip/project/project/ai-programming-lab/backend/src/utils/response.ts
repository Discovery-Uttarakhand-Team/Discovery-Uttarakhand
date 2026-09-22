import { Response } from "express";
import { ApiResponse } from "../types";

export const sendSuccess = <T>(res: Response, data: T, statusCode = 200): void => {
    const response: ApiResponse<T> = {
        success: true,
        data,
    };
    res.status(statusCode).json(response);
};

export const sendError = (
    res: Response,
    statusCode: number,
    code: string,
    message: string
): void => {
    const response: ApiResponse = {
        success: false,
        error: {
            code,
            message,
        },
    };
    res.status(statusCode).json(response);
};