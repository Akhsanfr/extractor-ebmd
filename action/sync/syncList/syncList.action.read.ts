"use server";

import { headers } from "next/headers";
import { syncListService } from "./syncList.service";
import { SyncListContract } from "./syncList.contract";
import { ActionResponse, handleActionError, OperationalError } from "@/action/actionResponse";
import { UserService } from "@/action/user/user/user.service";
import { UserRole } from "@/enum/user";

const ACTION_NAME = "syncList.action.read";

export async function actionGetSyncListsByJobId(
    jobId: number
): Promise<ActionResponse<SyncListContract.SelectWithProgressDTO[]>> {
    try {
        const session = await UserService.authorizeUser(await headers(), [UserRole.ADMIN]);

        const data = await syncListService.listsByJobId(jobId);

        return { success: true, data };
    } catch (err) {
        return handleActionError(err, ACTION_NAME);
    }
}

export async function getSyncListById(
    id: number
): Promise<ActionResponse<SyncListContract.SelectDTO>> {
    try {
        const session = await UserService.authorizeUser(await headers(), [UserRole.ADMIN]);

        const data = await syncListService.getListById(id);

        return { success: true, data };
    } catch (err) {
        return handleActionError(err, ACTION_NAME);
    }
}
