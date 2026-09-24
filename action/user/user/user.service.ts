import { db } from "@/drizzle";
import { UserContract } from "./user.contract";
import { UserRepository } from "./user.repository";
import { UserRole } from "@/enum/user";
import { auth, AuthSession } from "@/lib/auth/auth";
import { OperationalError } from "@/action/actionResponse";
import { UserRoleRepository } from "../userRole/userRole.repository";

export const UserService = {
    getUserWithProfileByUserId: async (userId: string): Promise<UserContract.SelectWithProfile | null> => {
        return UserRepository.getUserWithProfile(db, userId);
    },
    getUserWithDetailByUserId: async (userId: string): Promise<UserContract.SelectWithDetail | null> => {
        return UserRepository.getUserWithDetail(db, userId);
    },
    getUserWithDetail: async (reqHeaders: Headers): Promise<UserContract.SelectWithDetail | null> => {
        const session = await auth.api.getSession({ headers: reqHeaders });

        if (!session?.user) {
            throw new OperationalError(
                "Pengguna belum login atau sesi pengguna sudah berakhir."
            );
        }
        return UserRepository.getUserWithDetail(db, session.user.id);
    },
    getUserWithRoles: async (reqHeaders: Headers): Promise<UserContract.SelectWithRole> => {
        const session = await auth.api.getSession({ headers: reqHeaders });

        if (!session?.user) {
            throw new OperationalError(
                "Pengguna belum login atau sesi pengguna sudah berakhir."
            );
        }
        return UserRepository.getUserWithRole(db, session.user.id);
    },

    authorizeUser: async (
        reqHeaders: Headers,
        rolesToVerify: UserRole[] = []
    ): Promise<AuthSession> => {
        try {

            const authSession = await auth.api.getSession({ headers: reqHeaders });
            if (!authSession?.user) {
                throw new OperationalError(
                    "Pengguna belum login atau sesi pengguna sudah berakhir."
                );
            }
            if (rolesToVerify.length == 0) {
                return authSession;
            }
            const userRolesEntries = await UserRoleRepository.getUserRolesByUserId(db, authSession.user.id);
            const userRoles = userRolesEntries.map(r => r.role as UserRole);
            if (rolesToVerify.length > 0) {
                const hasAccess = userRoles.some(role => rolesToVerify.includes(role));
                if (!hasAccess) throw new OperationalError(`Pengguna tidak memiliki akses. Role dibutuhkan: ${rolesToVerify.join(", ")}. Role Anda: ${userRoles.join(", ")}`);
            }
            return authSession;
        } catch (error: any) {
            throw error;
        }
    },
    getListUser: async (): Promise<UserContract.SelectDTO[]> => {
        return UserRepository.getListUser(db);
    },
    getListUserWithDetail: async (): Promise<UserContract.SelectWithDetail[]> => {
        return UserRepository.getListUserWithDetail(db);
    },
    getListUserWithRole: async (): Promise<UserContract.SelectWithRole[]> => {
        return UserRepository.getListUserWithRole(db);
    },
    getUserSession: async (reqHeaders: Headers): Promise<string> => {
        const session = await auth.api.getSession({ headers: reqHeaders });
        if (!session?.user) {
            throw new OperationalError(
                "Pengguna belum login atau sesi pengguna sudah berakhir."
            );
        }
        return session.user.id;
    },
    hasAnyRoles: (roles: UserRole[], user: UserContract.SelectWithRole): void => {
        if (user.roles.some(role => roles.includes(role))) return;
        throw new OperationalError(`User tidak memiliki akses. Role dibutuhkan: ${roles.join(", ")}. Role Anda: ${user.roles.join(", ")}`);
    },
    hasAllRoles: (roles: UserRole[], user: UserContract.SelectWithRole): void => {
        if (user.roles.every(role => roles.includes(role))) return;
        throw new OperationalError(`User tidak memiliki akses. Role dibutuhkan: ${roles.join(", ")}. Role Anda: ${user.roles.join(", ")}`);
    }
}

