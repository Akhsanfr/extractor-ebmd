"use server";

import { headers } from "next/headers";
import { revalidatePath } from "next/cache";
import { syncJobService } from "./syncJob.service";
import { SyncJobContract } from "./syncJob.contract";
import { ActionResponse, handleActionError, OperationalError } from "@/action/actionResponse";
import { UserService } from "@/action/user/user/user.service";
import { UserRole } from "@/enum/user";

const ACTION_NAME = "syncJob.action.update";

export async function cancelSyncJob(
    input: SyncJobContract.CancelDTO
): Promise<ActionResponse<null>> {
    try {
        const session = await UserService.authorizeUser(await headers(), [UserRole.ADMIN]);

        const validated = SyncJobContract.cancel.safeParse(input);

        if (!validated.success) {
            throw new OperationalError(
                "Validation failed",
                validated.error.flatten((issue) => issue.message).fieldErrors
            );
        }

        await syncJobService.cancelJob(
            validated.data.id,
            session.user.id,
            validated.data.abortReason
        );

        revalidatePath("/dashboard/sync/job");
        revalidatePath(`/dashboard/sync/job/${validated.data.id}`);

        return { success: true, data: null, message: "Sync Job dibatalkan." };
    } catch (err) {
        return handleActionError(err, ACTION_NAME);
    }
}
