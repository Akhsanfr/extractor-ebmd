"use server";

import { revalidatePath } from "next/cache";
import { headers } from "next/headers";
import { BmdSubSyncContract } from "./bmdSubSync.contract";
import { ActionResponse, handleActionError, OperationalError } from "../actionResponse";
import { bmdSubSyncService } from "./bmdSubSync.service";

export async function stopBmdSubSyncAction(
    input: BmdSubSyncContract.StopDTO,
): Promise<ActionResponse<null>> {
    try {
        // await authorizeUser(await headers(), [RoleUser.ADMIN]);

        const validated = BmdSubSyncContract.stop.safeParse(input);
        if (!validated.success) {
            throw new OperationalError("Validasi gagal", validated.error.flatten().fieldErrors);
        }

        await bmdSubSyncService.stopRow(validated.data.id);

        revalidatePath("/bmd-sync");
        return { success: true, data: null };
    } catch (error) {
        return handleActionError(error);
    }
}