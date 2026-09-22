import { api } from "./api";
import { User } from "../types";

interface AuthData {
    user: User;
    accessToken: string;
    refreshToken: string;
}

export const authService = {
    async login(email: string, password: string): Promise<AuthData> {
        const data = await api.post<AuthData>("/auth/login", { email, password });
        api.setAccessToken(data.accessToken);
        localStorage.setItem("refreshToken", data.refreshToken);
        return data;
    },

    async register(data: {
        email: string;
        password: string;
        firstName: string;
        lastName: string;
        role: string;
        rollNumber?: string;
        employeeId?: string;
        department?: string;
    }): Promise<AuthData> {
        const result = await api.post<AuthData>("/auth/register", data);
        api.setAccessToken(result.accessToken);
        localStorage.setItem("refreshToken", result.refreshToken);
        return result;
    },

    async getCurrentUser(): Promise<{ user: User }> {
        return api.get<{ user: User }>("/auth/me");
    },

    async refreshToken(): Promise<AuthData> {
        const refreshToken = localStorage.getItem("refreshToken");
        if (!refreshToken) {
            throw new Error("No refresh token available");
        }
        const data = await api.post<AuthData>("/auth/refresh", { refreshToken });
        api.setAccessToken(data.accessToken);
        localStorage.setItem("refreshToken", data.refreshToken);
        return data;
    },

    async logout(): Promise<void> {
        try {
            await api.post("/auth/logout");
        } finally {
            api.setAccessToken(null);
            localStorage.removeItem("refreshToken");
        }
    },
};