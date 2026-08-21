import { db } from "@/drizzle";
import { UserContract } from "./user.contract";
import { UserRepository } from "./user.repository";
import { UserRole } from "@/enum/user";
import { auth, AuthSession } from "@/lib/auth";
import { OperationalError } from "@/action/actionResponse";
import { UserRoleRepository } from "../userRole/userRole.repository";

export const UserService = {
    getUserWithProfile: async (userId: string): Promise<UserContract.SelectWithProfile | null> => {
        return UserRepository.getUserWithProfile(db, userId);
    },
    getUserWithDetail: async (userId: string): Promise<UserContract.SelectWithDetail | null> => {
        return UserRepository.getUserWithDetail(db, userId);
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
            const userRolesEntries = await UserRoleRepository.getRolesByUserId(db, authSession.user.id);
            const userRoles = userRolesEntries.map(r => r.role as UserRole);
            if (rolesToVerify.length > 0) {
                const hasAccess = userRoles.some(role => rolesToVerify.includes(role));
                if (!hasAccess) throw new OperationalError(`Pengguna tidak memiliki akses. Role dibutuhkan: ${rolesToVerify.join(", ")}. Role Anda: ${userRoles.join(", ")}`);
            }
            return authSession;
        } catch (error: any) {
            throw error;
        }
    }
}