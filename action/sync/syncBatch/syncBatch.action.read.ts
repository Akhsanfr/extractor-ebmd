"use server";

import { headers } from "next/headers";
import { syncBatchService } from "./syncBatch.service";
import { SyncBatchContract } from "./syncBatch.contract";
import { ActionResponse, handleActionError, OperationalError } from "@/action/actionResponse";
import { UserService } from "@/action/user/user/user.service";
import { UserRole } from "@/enum/user";

const ACTION_NAME = "syncBatch.action.read";

export async function getSyncBatchesByListId(
    listId: number
): Promise<ActionResponse<SyncBatchContract.SelectDTO[]>> {
    try {
        await UserService.authorizeUser(await headers(), [UserRole.ADMIN]);

        const data = await syncBatchService.batchesByListId(listId);

        return { success: true, data };
    } catch (err) {
        return handleActionError(err, ACTION_NAME);
    }
}
