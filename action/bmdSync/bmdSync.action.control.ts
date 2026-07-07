"use server";

import { revalidatePath } from "next/cache";
import { headers } from "next/headers";
import { BmdSyncContract } from "./bmdSync.contract";
import { ActionResponse, handleActionError, OperationalError } from "../actionResponse";
import { bmdSyncService } from "./bmdSync.service";

async function validateId(input: BmdSyncContract.ControlDTO) {
    const validated = BmdSyncContract.control.safeParse(input);
    if (!validated.success) {
        throw new OperationalError("Validasi gagal", validated.error.flatten().fieldErrors);
    }
    return validated.data.id;
}

export async function playBmdSyncAction(
    input: BmdSyncContract.ControlDTO,
): Promise<ActionResponse<null>> {
    try {
        await authorizeUser(await headers(), [RoleUser.ADMIN]);
        const id = await validateId(input);

        await bmdSyncService.play(id);

        revalidatePath("/bmd-sync");
        return { success: true, data: null };
    } catch (error) {
        return handleActionError(error);
    }
}

export async function pauseBmdSyncAction(
    input: BmdSyncContract.ControlDTO,
): Promise<ActionResponse<null>> {
    try {
        await authorizeUser(await headers(), [RoleUser.ADMIN]);
        const id = await validateId(input);

        await bmdSyncService.pause(id);

        revalidatePath("/bmd-sync");
        return { success: true, data: null };
    } catch (error) {
        return handleActionError(error);
    }
}

export async function resumeBmdSyncAction(
    input: BmdSyncContract.ControlDTO,
): Promise<ActionResponse<null>> {
    try {
        await authorizeUser(await headers(), [RoleUser.ADMIN]);
        const id = await validateId(input);

        await bmdSyncService.resume(id);

        revalidatePath("/bmd-sync");
        return { success: true, data: null };
    } catch (error) {
        return handleActionError(error);
    }
}

export async function stopBmdSyncAction(
    input: BmdSyncContract.ControlDTO,
): Promise<ActionResponse<null>> {
    try {
        await authorizeUser(await headers(), [RoleUser.ADMIN]);
        const id = await validateId(input);

        await bmdSyncService.stop(id);

        revalidatePath("/bmd-sync");
        return { success: true, data: null };
    } catch (error) {
        return handleActionError(error);
    }
}