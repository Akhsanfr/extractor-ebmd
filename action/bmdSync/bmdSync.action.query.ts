"use server";

import { headers } from "next/headers";
import { ActionResponse, handleActionError } from "../actionResponse";
import { BmdSyncContract } from "./bmdSync.contract";
import { bmdSyncService } from "./bmdSync.service";

export async function getAllBmdSyncAction(): Promise<ActionResponse<BmdSyncContract.SelectDTO[]>> {
    try {
        const data = await bmdSyncService.getAll();
        return { success: true, data };
    } catch (error) {
        return handleActionError(error);
    }
}

export async function getBmdSyncByIdAction(
    id: number,
): Promise<ActionResponse<BmdSyncContract.SelectDTO>> {
    try {
        const data = await bmdSyncService.getById(id);
        return { success: true, data };
    } catch (error) {
        return handleActionError(error);
    }
}