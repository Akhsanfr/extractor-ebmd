import { DbOrTx } from "@/action/baseDbOrTx";
import { UserContract } from "./user.contract";

export const UserRepository = {
    getUserWithProfile: async (
        db: DbOrTx,
        userId: string
    ): Promise<UserContract.SelectWithProfile | null> => {
        const res = await db.query.userTable.findFirst({
            where: (table, { eq }) => eq(table.id, userId),
            with: {
                profile: {
                    with: {
                        perangkatDaerah: true
                    }
                }
            }
        });
        return res ?? null;
    },
    getUserWithDetail: async (
        db: DbOrTx,
        userId: string
    ): Promise<UserContract.SelectWithDetail | null> => {
        const res = await db.query.userTable.findFirst({
            where: (table, { eq }) => eq(table.id, userId),
            with: {
                profile: {
                    with: {
                        perangkatDaerah: true
                    }
                },
                roles: true
            }
        });
        return res ?? null;
    },
    getUserWithRole: async (
        db: DbOrTx,
        userId: string
    ): Promise<UserContract.SelectWithRole | null> => {
        const res = await db.query.userTable.findFirst({
            where: (user, { eq }) => eq(user.id, userId),
            with: {
                roles: true
            }
        });
        return res ?? null;
    },
}