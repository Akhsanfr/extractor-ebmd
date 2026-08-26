import { and, eq, inArray } from "drizzle-orm";
import { UserRoleContract } from "./userRole.contract";
import { DbOrTx } from "@/action/baseDbOrTx";
import { UserRole } from "@/enum/user";
import { userRoleTable } from "@/drizzle/schema";

export const UserRoleRepository = {

    getUserRolesByUserId: (db: DbOrTx, userId: string): Promise<UserRoleContract.Select[]> => {
        return db.query.userRoleTable.findMany({
            where: {
                userId: userId
            }
        })
    },
    syncRoles: async (
        db: DbOrTx,
        input: UserRoleContract.SyncRoles, createdBy: string
    ): Promise<void> => {
        // delete all existing, then re-insert — full replace
        await db.delete(userRoleTable).where(eq(userRoleTable.userId, input.userId));
        if (input.roles.length === 0) return;
        await db
            .insert(userRoleTable)
            .values(input.roles.map((role) => ({ userId: input.userId, role, createdBy })))
            .returning();
    },
};