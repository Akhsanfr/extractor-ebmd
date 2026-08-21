import { OperationalError } from "@/action/actionResponse";
import { syncBatchRepository } from "./syncBatch.repository";

export const syncBatchService = {
    async batchesByListId(listId: number) {
        return syncBatchRepository.findByListId(listId);
    },

    // Dipanggil oleh syncList.service saat Sync List dibuat.
    async generateBatchesForList(
        listId: number,
        batchCount: number,
        batchSize: number,
        userId: string
    ) {
        const batches = Array.from({ length: batchCount }, (_, i) => ({
            batchSize,
            batchPage: i + 1,
        }));

        return syncBatchRepository.createMany(listId, batches, userId);
    },

    // Retry hanya mengulang batch yang gagal, tanpa mengulang batch lain yang
    // sudah berhasil (lihat KONSEP: "Retry").
    async retryBatch(id: number) {
        const batch = await syncBatchRepository.findById(id);

        if (!batch) {
            throw new OperationalError("Sync Batch tidak ditemukan.");
        }

        if (batch.status !== "failed") {
            throw new OperationalError(
                "Hanya batch dengan status failed yang dapat di-retry."
            );
        }

        return syncBatchRepository.incrementRetry(id);
    },

};
