"use server";

import { headers } from "next/headers";
import { revalidatePath } from "next/cache";
import { syncListRepository } from "./syncList.repository";
import { SyncListContract } from "./syncList.contract";
import { ActionResponse, handleActionError, OperationalError } from "@/action/actionResponse";
import { UserService } from "@/action/user/user/user.service";
import { UserRole } from "@/enum/user";

const ACTION_NAME = "syncList.action.create";

// Dipakai untuk menambahkan endpoint tambahan secara manual ke Job yang sudah
// ada (di luar pembuatan otomatis via provider saat createSyncJob).
export async function createSyncList(
    input: SyncListContract.CreateDTO
): Promise<ActionResponse<{ id: number }>> {
    try {
        const session = await UserService.authorizeUser(await headers(), [UserRole.ADMIN]);

        const validated = SyncListContract.create.safeParse(input);

        if (!validated.success) {
            throw new OperationalError(
                "Validation failed",
                validated.error.flatten((issue) => issue.message).fieldErrors
            );
        }

        const list = await syncListRepository.create(
            validated.data.jobId,
            { endpoint: validated.data.endpoint, worker: validated.data.worker },
            session.user.id
        );

        revalidatePath(`/dashboard/sync/job/${validated.data.jobId}`);

        return {
            success: true,
            data: { id: list.id },
            message: "Sync List berhasil ditambahkan.",
        };
    } catch (err) {
        return handleActionError(err, ACTION_NAME);
    }
}
