const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000/api/v1";

interface ApiResponse<T = unknown> {
    success: boolean;
    data?: T;
    error?: {
        code: string;
        message: string;
    };
}

class ApiClient {
    private baseUrl: string;
    private accessToken: string | null;

    constructor() {
        this.baseUrl = API_URL;
        this.accessToken = localStorage.getItem("accessToken");
    }

    setAccessToken(token: string | null) {
        this.accessToken = token;
        if (token) {
            localStorage.setItem("accessToken", token);
        } else {
            localStorage.removeItem("accessToken");
        }
    }

    getAccessToken(): string | null {
        return this.accessToken;
    }

    private async request<T>(
        method: string,
        path: string,
        body?: unknown
    ): Promise<T> {
        const headers: Record<string, string> = {
            "Content-Type": "application/json",
        };

        if (this.accessToken) {
            headers["Authorization"] = `Bearer ${this.accessToken}`;
        }

        const response = await fetch(`${this.baseUrl}${path}`, {
            method,
            headers,
            body: body ? JSON.stringify(body) : undefined,
        });

        const data = (await response.json()) as ApiResponse<T>;

        if (!response.ok || !data.success) {
            throw new Error(data.error?.message || "Request failed");
        }

        return data.data as T;
    }

    async get<T>(path: string): Promise<T> {
        return this.request<T>("GET", path);
    }

    async post<T>(path: string, body?: unknown): Promise<T> {
        return this.request<T>("POST", path, body);
    }

    async put<T>(path: string, body?: unknown): Promise<T> {
        return this.request<T>("PUT", path, body);
    }

    async delete<T>(path: string): Promise<T> {
        return this.request<T>("DELETE", path);
    }
}

export const api = new ApiClient();