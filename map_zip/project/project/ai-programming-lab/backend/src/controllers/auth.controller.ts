import { Request, Response } from "express";
import { AuthService } from "../services/AuthService";
import { asyncHandler } from "../utils/asyncHandler";
import { sendSuccess } from "../utils/response";

const authService = new AuthService();

export const register = asyncHandler(async (req: Request, res: Response) => {
    const result = await authService.register(req.body);
    sendSuccess(res, result, 201);
});

export const login = asyncHandler(async (req: Request, res: Response) => {
    const { email, password } = req.body;
    const result = await authService.login(email, password);
    sendSuccess(res, result);
});

export const logout = asyncHandler(async (_req: Request, res: Response) => {
    // In a stateless JWT setup, logout is handled client-side by discarding tokens.
    // For future enhancement, we can blacklist tokens here.
    sendSuccess(res, { message: "Logged out successfully" });
});

export const refreshToken = asyncHandler(async (req: Request, res: Response) => {
    const { refreshToken } = req.body;
    const result = await authService.refreshToken(refreshToken);
    sendSuccess(res, result);
});

export const getCurrentUser = asyncHandler(async (req: Request, res: Response) => {
    const user = await authService.getCurrentUser(req.user!.id);
    sendSuccess(res, { user });
});