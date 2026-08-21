"use server";

import { headers } from "next/headers";
import { revalidatePath } from "next/cache";
import { syncBatchService } from "./syncBatch.service";
import { SyncBatchContract } from "./syncBatch.contract";
import { ActionResponse, handleActionError, OperationalError } from "@/action/actionResponse";
import { UserService } from "@/action/user/user/user.service";
import { UserRole } from "@/enum/user";

const ACTION_NAME = "syncBatch.action.update";

export async function retrySyncBatch(
    input: SyncBatchContract.RetryDTO
): Promise<ActionResponse<null>> {
    try {
        const session = await UserService.authorizeUser(await headers(), [UserRole.ADMIN]);

        const validated = SyncBatchContract.retry.safeParse(input);

        if (!validated.success) {
            throw new OperationalError(
                "Validation failed",
                validated.error.flatten((issue) => issue.message).fieldErrors
            );
        }

        const batch = await syncBatchService.retryBatch(validated.data.id);

        revalidatePath(`/dashboard/sync/list/${batch.listId}`);

        return { success: true, data: null, message: "Batch di-retry." };
    } catch (err) {
        return handleActionError(err, ACTION_NAME);
    }
}
