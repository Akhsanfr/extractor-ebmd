import { and, eq, inArray } from "drizzle-orm";
import { UserRoleContract } from "./userRole.contract";
import { DbOrTx } from "@/action/baseDbOrTx";
import { UserRole } from "@/enum/user";
import { userRoleTable } from "@/drizzle/schema";

export const UserRoleRepository = {
    getRolesByUserId: async (
        db: DbOrTx,
        userId: string
    ): Promise<UserRoleContract.Select[]> => {
        return db.query.userRoleTable.findMany({
            where: (table, { eq }) => eq(table.userId, userId),
        });
    },

    attachRole: async (
        db: DbOrTx,
        userId: string,
        role: UserRole
    ): Promise<UserRoleContract.Select> => {
        // upsert — ignore if already exists
        const existing = await db.query.userRoleTable.findFirst({
            where: (table, { and, eq }) =>
                and(eq(table.userId, userId), eq(table.role, role)),
        });
        if (existing) return existing;

        const [inserted] = await db
            .insert(userRoleTable)
            .values({ userId, role })
            .returning();

        return inserted;
    },

    attachRoles: async (
        db: DbOrTx,
        userId: string,
        roles: UserRole[]
    ): Promise<UserRoleContract.Select[]> => {
        // filter out already-assigned roles first
        const existing = await db.query.userRoleTable.findMany({
            where: (table, { and, eq, inArray }) =>
                and(eq(table.userId, userId), inArray(table.role, roles)),
        });
        const existingRoles = new Set(existing.map((r) => r.role));
        const newRoles = roles.filter((r) => !existingRoles.has(r));

        if (newRoles.length === 0) return existing;

        const inserted = await db
            .insert(userRoleTable)
            .values(newRoles.map((role) => ({ userId, role })))
            .returning();

        return [...existing, ...inserted];
    },

    detachRole: async (
        db: DbOrTx,
        userId: string,
        role: UserRole
    ): Promise<boolean> => {
        const result = await db
            .delete(userRoleTable)
            .where(and(eq(userRoleTable.userId, userId), eq(userRoleTable.role, role)))
            .returning();

        return result.length > 0;
    },

    detachAllRoles: async (
        db: DbOrTx,
        userId: string
    ): Promise<boolean> => {
        const result = await db
            .delete(userRoleTable)
            .where(eq(userRoleTable.userId, userId))
            .returning();

        return result.length > 0;
    },

    syncRoles: async (
        db: DbOrTx,
        userId: string,
        roles: UserRole[]
    ): Promise<UserRoleContract.Select[]> => {
        // delete all existing, then re-insert — full replace
        await db.delete(userRoleTable).where(eq(userRoleTable.userId, userId));

        if (roles.length === 0) return [];

        return db
            .insert(userRoleTable)
            .values(roles.map((role) => ({ userId, role })))
            .returning();
    },
};