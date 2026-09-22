export class ApiError extends Error {
    public readonly statusCode: number;
    public readonly code: string;
    public readonly details?: unknown;

    constructor(statusCode: number, code: string, message: string, details?: unknown) {
        super(message);
        this.statusCode = statusCode;
        this.code = code;
        this.details = details;
        Error.captureStackTrace(this, this.constructor);
    }

    static badRequest(message: string, code = "BAD_REQUEST", details?: unknown): ApiError {
        return new ApiError(400, code, message, details);
    }

    static unauthorized(message = "Unauthorized", code = "UNAUTHORIZED"): ApiError {
        return new ApiError(401, code, message);
    }

    static forbidden(message = "Forbidden", code = "FORBIDDEN"): ApiError {
        return new ApiError(403, code, message);
    }

    static notFound(message = "Not found", code = "NOT_FOUND"): ApiError {
        return new ApiError(404, code, message);
    }

    static conflict(message: string, code = "CONFLICT"): ApiError {
        return new ApiError(409, code, message);
    }

    static internal(message = "Internal server error", code = "INTERNAL_SERVER_ERROR"): ApiError {
        return new ApiError(500, code, message);
    }
}