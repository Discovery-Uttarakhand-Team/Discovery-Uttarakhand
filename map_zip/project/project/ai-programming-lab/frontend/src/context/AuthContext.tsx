import {
    createContext,
    useContext,
    useEffect,
    useState,
    ReactNode,
} from "react";
import { User } from "../types";
import { authService } from "../services/auth.service";
import { api } from "../services/api";

interface AuthContextType {
    user: User | null;
    isLoading: boolean;
    isAuthenticated: boolean;
    login: (email: string, password: string) => Promise<void>;
    register: (data: RegisterData) => Promise<void>;
    logout: () => Promise<void>;
}

interface RegisterData {
    email: string;
    password: string;
    firstName: string;
    lastName: string;
    role: string;
    rollNumber?: string;
    employeeId?: string;
    department?: string;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
    const [user, setUser] = useState<User | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const initAuth = async () => {
            const token = api.getAccessToken();
            if (!token) {
                setIsLoading(false);
                return;
            }

            try {
                const { user } = await authService.getCurrentUser();
                setUser(user);
            } catch {
                // Token might be expired, try to refresh
                try {
                    const data = await authService.refreshToken();
                    setUser(data.user);
                } catch {
                    await authService.logout();
                    setUser(null);
                }
            } finally {
                setIsLoading(false);
            }
        };

        initAuth();
    }, []);

    const login = async (email: string, password: string) => {
        const data = await authService.login(email, password);
        setUser(data.user);
    };

    const register = async (data: RegisterData) => {
        const result = await authService.register(data);
        setUser(result.user);
    };

    const logout = async () => {
        await authService.logout();
        setUser(null);
    };

    return (
        <AuthContext.Provider
            value={{
                user,
                isLoading,
                isAuthenticated: !!user,
                login,
                register,
                logout,
            }}
        >
            {children}
        </AuthContext.Provider>
    );
}

export function useAuth() {
    const context = useContext(AuthContext);
    if (context === undefined) {
        throw new Error("useAuth must be used within an AuthProvider");
    }
    return context;
}