export const UserRole = {
    ADMIN: "admin",
} as const;

export type UserRole = typeof UserRole[keyof typeof UserRole];