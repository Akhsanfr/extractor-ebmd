"use server";

import { headers } from "next/headers";
import { revalidatePath } from "next/cache";
import { syncJobService } from "./syncJob.service";
import { SyncJobContract } from "./syncJob.contract";
import { ActionResponse, handleActionError, OperationalError } from "@/action/actionResponse";
import { UserService } from "@/action/user/user/user.service";
import { UserRole } from "@/enum/user";

const ACTION_NAME = "syncJob.action.create";

export async function createSyncJob(
    input: SyncJobContract.CreateDTO
): Promise<ActionResponse<null>> {
    try {
        const session = await UserService.authorizeUser(await headers(), [UserRole.ADMIN]);

        const validated = SyncJobContract.create.safeParse(input);

        if (!validated.success) {
            throw new OperationalError(
                "Validation failed",
                validated.error.flatten((issue) => issue.message).fieldErrors
            );
        }

        const job = await syncJobService.createJob(validated.data, session.user.id);

        revalidatePath("/dashboard/sync/job");

        return {
            success: true,
            data: null,
            message: "Sync Job berhasil dibuat.",
        };
    } catch (err) {
        return handleActionError(err, ACTION_NAME);
    }
}
