"use server";

import { headers } from "next/headers";
import { revalidatePath } from "next/cache";
import { syncListService } from "./syncList.service";
import { SyncListContract } from "./syncList.contract";
import { ActionResponse, handleActionError, OperationalError } from "@/action/actionResponse";
import { UserService } from "@/action/user/user/user.service";
import { UserRole } from "@/enum/user";

const ACTION_NAME = "syncList.action.update";

export async function editSyncList(
    input: SyncListContract.EditDTO
): Promise<ActionResponse<null>> {
    try {
        const session = await UserService.authorizeUser(await headers(), [UserRole.ADMIN]);

        const validated = SyncListContract.edit.safeParse(input);

        if (!validated.success) {
            throw new OperationalError(
                "Validation failed",
                validated.error.flatten((issue) => issue.message).fieldErrors
            );
        }

        const list = await syncListService.editList(validated.data);

        revalidatePath(`/dashboard/sync/job/${list.jobId}`);

        return { success: true, data: null, message: "Sync List diperbarui." };
    } catch (err) {
        return handleActionError(err, ACTION_NAME);
    }
}

export async function retrySyncList(id: number): Promise<ActionResponse<null>> {
    try {
        const session = await UserService.authorizeUser(await headers(), [UserRole.ADMIN]);

        const list = await syncListService.retryList(id);

        revalidatePath(`/dashboard/sync/job/${list.jobId}`);

        return { success: true, data: null, message: "Sync List di-retry." };
    } catch (err) {
        return handleActionError(err, ACTION_NAME);
    }
}
