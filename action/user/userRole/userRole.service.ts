import { db } from "@/drizzle";
import { UserRoleContract } from "./userRole.contract";
import { UserRoleRepository } from "./userRole.repository";

export const UserRoleService = {
    syncRoles: async (input: UserRoleContract.SyncRoles, createdBy: string): Promise<void> => {
        await UserRoleRepository.syncRoles(db, input, createdBy);
    },
};