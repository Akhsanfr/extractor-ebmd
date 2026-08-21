import { resolveSyncProvider } from "@/lib/sync-provider";
import { syncJobRepository } from "./syncJob.repository";
import { syncListService } from "@/action/sync/syncList/syncList.service";
import { SyncJobContract } from "./syncJob.contract";
import { OperationalError } from "@/action/actionResponse";
import { db } from "@/drizzle";
import { SyncListContract } from "../syncList/syncList.contract";
import { syncListRepository } from "../syncList/syncList.repository";

export const syncJobService = {
    async listJobs() {
        return syncJobRepository.findAllWithProgress(db);
    },

    async getJobById(id: number) {
        const job = await syncJobRepository.findById(db, id);

        if (!job) {
            throw new OperationalError("Sync Job tidak ditemukan.");
        }

        return job;
    },

    // Workflow: Create Job -> Generate Sync List -> Generate Batch (dilimpahkan
    // ke syncListService, yang meneruskan pembuatan batch ke syncBatchService).
    async createJob(data: SyncJobContract.CreateDTO, userId: string) {

        await db.transaction(async tx => {
            // 1. Create Job
            const job = await syncJobRepository.create(tx, data, userId)
            console.log("job", job)
            // 2. Insert List
            const syncListData: SyncListContract.CreateDTO[] = []
            data.lokasi.forEach(lokasi => {
                data.assetType.forEach(assetType => {
                    syncListData.push({
                        payload: {
                            kodeLokasi: lokasi,
                            assetType: assetType
                        },
                        jobId: job.id,
                        createdBy: userId,
                        status: "pending"
                    })
                })
            })
            // data.item.forEach(item => {
            //     item.assetType.forEach(type => {
            //         syncListData.push({
            //             payload: {
            //                 kodeLokasi: item.lokasi,
            //                 assetType: type
            //             },
            //             jobId: job.id,
            //             createdBy: userId,
            //             status: "pending"
            //         })
            //     })
            // })

            // 3. Insert List
            await syncListRepository.create(tx, syncListData)
        })
    },

    async cancelJob(id: number, userId: string, abortReason: string) {
        // const job = await syncJobRepository.findById(id);

        // if (!job) {
        //     throw new OperationalError("Sync Job tidak ditemukan.");
        // }

        // if (job.status === "completed" || job.status === "cancelled") {
        //     throw new OperationalError(
        //         "Sync Job yang sudah selesai atau dibatalkan tidak dapat dibatalkan kembali."
        //     );
        // }

        // return syncJobRepository.cancel(id, userId, abortReason);
    },
};
