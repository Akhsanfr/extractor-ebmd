export const UserRole = {
    ADMIN: "admin",
    ADMIN_OPD: "admin-opd",
    USER: "user"
} as const;

export type UserRole = typeof UserRole[keyof typeof UserRole];