import { syncListRepository } from "./syncList.repository";
import { SyncListContract } from "./syncList.contract";
import { OperationalError } from "@/action/actionResponse";

export const syncListService = {
    async listsByJobId(jobId: number) {
        return syncListRepository.findByJobIdWithProgress(jobId);
    },

    async getListById(id: number) {
        const list = await syncListRepository.findById(id);

        if (!list) {
            throw new OperationalError("Sync List tidak ditemukan.");
        }

        return list;
    },

    async editList(data: SyncListContract.EditDTO) {
        const list = await syncListRepository.findById(data.id);

        if (!list) {
            throw new OperationalError("Sync List tidak ditemukan.");
        }

        return syncListRepository.updateEndpoint(data.id, data);
    },

    async retryList(id: number) {
        const list = await syncListRepository.findById(id);

        if (!list) {
            throw new OperationalError("Sync List tidak ditemukan.");
        }

        if (list.status !== "failed") {
            throw new OperationalError(
                "Hanya Sync List berstatus failed yang dapat di-retry."
            );
        }

        return syncListRepository.updateStatus(id, "pending", { lastError: null });
    },
};
