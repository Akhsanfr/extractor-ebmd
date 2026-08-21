"use server";

import { headers } from "next/headers";
import { revalidatePath } from "next/cache";
import { syncBatchRepository } from "./syncBatch.repository";
import { SyncBatchContract } from "./syncBatch.contract";
import { UserService } from "../../user/user/user.service";
import { ActionResponse, handleActionError, OperationalError } from "../../actionResponse";
import { UserRole } from "@/enum/user";

const ACTION_NAME = "syncBatch.action.create";

// Dipakai untuk menambahkan batch tambahan secara manual ke List yang sudah
// ada (di luar pembuatan otomatis saat createSyncJob).
export async function createSyncBatch(
    input: SyncBatchContract.CreateDTO
): Promise<ActionResponse<{ id: number }>> {
    try {
        const session = await UserService.authorizeUser(await headers(), [UserRole.ADMIN]);

        const validated = SyncBatchContract.create.safeParse(input);

        if (!validated.success) {
            throw new OperationalError(
                "Validation failed",
                validated.error.flatten((issue) => issue.message).fieldErrors
            );
        }

        const [batch] = await syncBatchRepository.createMany(
            validated.data.listId,
            [{ batchSize: validated.data.batchSize, batchPage: validated.data.batchPage }],
            session.user.id
        );

        revalidatePath(`/dashboard/sync/list/${validated.data.listId}`);

        return {
            success: true,
            data: { id: batch.id },
            message: "Sync Batch berhasil ditambahkan.",
        };
    } catch (err) {
        return handleActionError(err, ACTION_NAME);
    }
}
