import { DbOrTx } from "@/action/baseDbOrTx";
import { UserContract } from "./user.contract";
import { OperationalError } from "@/action/actionResponse";

export const UserRepository = {
    getUserWithProfile: async (
        db: DbOrTx,
        userId: string
    ): Promise<UserContract.SelectWithProfile | null> => {

        const res = await db.query.userTable.findFirst({
            where: {
                id: userId
            },
            with: {
                profile: true
            }
        });
        return res ?? null;
    },
    getUserWithDetail: async (
        db: DbOrTx,
        userId: string
    ): Promise<UserContract.SelectWithDetail | null> => {
        const user = await db.query.userTable.findFirst({
            where: {
                id: userId
            },
            with: {
                profile: true,
                roles: true
            }
        });
        if (!user) return null;
        return { ...user, roles: user?.roles.map(r => r.role) ?? [] }
    },
    getUserWithRole: async (
        db: DbOrTx,
        userId: string
    ): Promise<UserContract.SelectWithRole> => {
        const res = await db.query.userTable.findFirst({
            where: {
                id: userId
            },
            with: {
                roles: true
            }
        });
        if (!res) throw new OperationalError("User tidak ditemukan")
        return { ...res, roles: res.roles.map(r => r.role) }
    },
    getListUserWithDetail: async (
        db: DbOrTx
    ): Promise<UserContract.SelectWithDetail[]> => {
        const res = await db.query.userTable.findMany({
            with: {
                roles: true,
                profile: true
            }
        });
        return res.map(u => ({ ...u, roles: u.roles.map(r => r.role) }))
    },
    getListUser: async (db: DbOrTx): Promise<UserContract.SelectDTO[]> => {
        return await db.query.userTable.findMany();
    },
    getListUserWithRole: async (db: DbOrTx): Promise<UserContract.SelectWithRole[]> => {
        const res = await db.query.userTable.findMany({
            with: {
                roles: true
            }
        });
        return res.map(u => ({ ...u, roles: u.roles.map(r => r.role) }))
    }
}