"use server"
import { ActionResponse, handleActionError, OperationalError } from "@/action/actionResponse";
import { UserRoleContract } from "./userRole.contract";
import { UserRoleService } from "./userRole.service";
import { UserRole } from "@/enum/user";
import { UserService } from "../user/user.service";
import { headers } from "next/headers";
import { revalidatePath } from "next/cache";
export const actionSyncUserRoles = async (input: UserRoleContract.SyncRoles): Promise<ActionResponse<undefined>> => {
    try {
        const user = await UserService.authorizeUser(await headers(), [UserRole.ADMIN]);

        const validated = UserRoleContract.syncRoles.safeParse(input);

        if (!validated.success) {
            console.log(validated)
            throw new OperationalError(
                "Validation failed",
                validated.error.flatten((issue) => issue.message).fieldErrors
            );
        }

        await UserRoleService.syncRoles(validated.data, user.user.id);

        revalidatePath("/dashboard/admin/user-role");
        return { success: true, data: undefined };
    } catch (error) {
        return handleActionError(error);
    }
};