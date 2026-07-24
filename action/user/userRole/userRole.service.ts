import { db } from "@/drizzle";
import { UserRoleContract } from "./userRole.contract";
import { UserRoleRepository } from "./userRole.repository";
import { UserRole } from "@/enum/user";

export const UserRoleService = {
    getRolesByUserId: async (userId: string): Promise<UserRoleContract.Select[]> => {
        return UserRoleRepository.getRolesByUserId(db, userId);
    },

    attachRole: async (userId: string, role: UserRole): Promise<UserRoleContract.Select> => {
        return UserRoleRepository.attachRole(db, userId, role);
    },

    attachRoles: async (userId: string, roles: UserRole[]): Promise<UserRoleContract.Select[]> => {
        return UserRoleRepository.attachRoles(db, userId, roles);
    },

    detachRole: async (userId: string, role: UserRole): Promise<boolean> => {
        return UserRoleRepository.detachRole(db, userId, role);
    },

    detachAllRoles: async (userId: string): Promise<boolean> => {
        return UserRoleRepository.detachAllRoles(db, userId);
    },

    syncRoles: async (userId: string, roles: UserRole[]): Promise<UserRoleContract.Select[]> => {
        return UserRoleRepository.syncRoles(db, userId, roles);
    },
};