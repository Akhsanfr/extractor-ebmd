"use server";

import { headers } from "next/headers";
import { syncJobService } from "./syncJob.service";
import { SyncJobContract } from "./syncJob.contract";
import { ActionResponse, handleActionError, OperationalError } from "@/action/actionResponse";
import { UserService } from "@/action/user/user/user.service";
import { UserRole } from "@/enum/user";

const ACTION_NAME = "syncJob.action.read";

export async function actionGetSyncJobs(): Promise<
    ActionResponse<SyncJobContract.SelectWithProgressDTO[]>
> {
    try {
        await UserService.authorizeUser(await headers(), [UserRole.ADMIN]);

        const data = await syncJobService.listJobs();

        return { success: true, data };
    } catch (err) {
        return handleActionError(err, ACTION_NAME);
    }
}

export async function actionGetSyncJobById(
    id: number
): Promise<ActionResponse<SyncJobContract.SelectDTO>> {
    try {
        await UserService.authorizeUser(await headers(), [UserRole.ADMIN]);

        const data = await syncJobService.getJobById(id);

        return { success: true, data };
    } catch (err) {
        return handleActionError(err, ACTION_NAME);
    }
}
