"use server";

import { revalidatePath } from "next/cache";
import { headers } from "next/headers";
import { BmdSyncContract } from "./bmdSync.contract";
import { ActionResponse, handleActionError, OperationalError } from "../actionResponse";
import { bmdSyncService } from "./bmdSync.service";

export async function createBmdSyncAction(
    input: BmdSyncContract.CreateDTO,
): Promise<ActionResponse<{ id: number }>> {
    try {

        const validated = BmdSyncContract.create.safeParse(input);
        if (!validated.success) {
            throw new OperationalError("Validasi gagal", validated.error.flatten().fieldErrors);
        }

        const sync = await bmdSyncService.createSync(user.id, validated.data);

        revalidatePath("/bmd-sync");

        return { success: true, data: { id: sync.id } };
    } catch (error) {
        return handleActionError(error);
    }
}