"use server";

import { headers } from "next/headers";
import { ActionResponse, handleActionError } from "../actionResponse";
import { BmdSubSyncContract } from "./bmdSubSync.contract";
import { bmdSubSyncService } from "./bmdSubSync.service";

export async function getBmdSubSyncBySyncIdAction(
    syncId: number,
): Promise<ActionResponse<BmdSubSyncContract.SelectDTO[]>> {
    try {
        const data = await bmdSubSyncService.getBySyncId(syncId);
        return { success: true, data };
    } catch (error) {
        return handleActionError(error);
    }
}