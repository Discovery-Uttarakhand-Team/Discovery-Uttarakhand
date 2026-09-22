export const Role = {
    STUDENT: "STUDENT",
    TEACHER: "TEACHER",
    ADMIN: "ADMIN",
} as const;

export type Role = (typeof Role)[keyof typeof Role];

export interface User {
    id: string;
    email: string;
    firstName: string;
    lastName: string;
    role: Role;
}

export interface AuthResponse {
    success: boolean;
    data: {
        user: User;
        accessToken: string;
        refreshToken: string;
    };
}

export interface ApiError {
    success: false;
    error: {
        code: string;
        message: string;
    };
}

export interface StudentDashboardData {
    student: {
        id: string;
        rollNumber: string;
        classes: Array<{
            id: string;
            name: string;
            code: string;
            courses: Array<{
                id: string;
                name: string;
                code: string;
            }>;
        }>;
    };
    stats: {
        totalClasses: number;
        totalCourses: number;
        problemsSolved: number;
        assignmentsCompleted: number;
        quizScore: number;
        overallProgress: number;
    };
    recentActivity: unknown[];
    todaysFocus: unknown;
}

export interface TeacherDashboardData {
    teacher: {
        id: string;
        employeeId: string;
        department: string | null;
        classes: Array<{
            id: string;
            name: string;
            code: string;
            studentCount: number;
            courseCount: number;
        }>;
    };
    stats: {
        totalStudents: number;
        totalClasses: number;
        totalLabs: number;
        totalAssignments: number;
        averagePerformance: number;
    };
    recentActivity: unknown[];
}

export interface AdminDashboardData {
    stats: {
        totalStudents: number;
        totalTeachers: number;
        totalAdmins: number;
        totalClasses: number;
        totalCourses: number;
        totalTopics: number;
    };
    systemActivity: unknown[];
}