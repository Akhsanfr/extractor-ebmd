import { createAccessControl } from "better-auth/plugins/access";
import { defaultStatements, adminAc } from "better-auth/plugins/admin/access";
import { UserRole } from "@/enum/user";

const statement = {
    ...defaultStatements,
    "alih-status": ["create", "read", "update", "delete"],
} as const;

export const ac = createAccessControl(statement);

export const admin = ac.newRole({
    "alih-status": ["create", "read", "update", "delete"],
    ...adminAc.statements,
});

export const adminOpd = ac.newRole({
    "alih-status": ["create", "read", "update", "delete"],
});

export const roleDefinitions = {
    [UserRole.ADMIN]: admin,
    [UserRole.ADMIN_OPD]: adminOpd
} as const;

export function parseRoles(
    role: string | null | undefined,
): UserRole[] {
    if (!role) return [];

    return role
        .split(",")
        .map((value) => value.trim())
        .filter((value): value is UserRole =>
            Object.values(UserRole).includes(value as UserRole),
        );
}