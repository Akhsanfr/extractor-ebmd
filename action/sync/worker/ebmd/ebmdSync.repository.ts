import { and, eq, sql } from "drizzle-orm";
import type { SyncBatchInsert, SyncRepository } from "./ebmdSync.worker";
import { db } from "@/drizzle";
import { syncJobTable, syncListTable, syncBatchTable } from "@/drizzle/schema";
import type { BatchContext, ListContext } from "../worker";
import { SyncJobType, SyncStatus } from "@/enum/sync";

/**
 * jobType yang membedakan job sinkronisasi BMD dari eBMD terhadap jobType
 * lain yang mungkin ditangani SyncWorker lainnya. Sesuaikan dengan value
 * yang terdaftar di syncJobTypeEnum.
 */

const LOG_TAG = "[ebmdSyncRepository]";

export const ebmdSyncRepository: SyncRepository = {
    async claimNextList(): Promise<ListContext | null> {
        try {
            return await db.transaction(async (tx) => {
                const [candidate] = await tx
                    .select({ list: syncListTable, job: syncJobTable })
                    .from(syncListTable)
                    .innerJoin(syncJobTable, eq(syncListTable.jobId, syncJobTable.id))
                    .where(
                        and(eq(syncListTable.status, SyncStatus.Pending), eq(syncJobTable.jobType, SyncJobType.EBMD)),
                    )
                    .orderBy(syncListTable.id)
                    .limit(1)
                    .for("update", { of: syncListTable, skipLocked: true });

                if (!candidate) return null;

                const [updatedList] = await tx
                    .update(syncListTable)
                    .set({ status: "processing", startedAt: new Date() })
                    .where(eq(syncListTable.id, candidate.list.id))
                    .returning();

                // Tandai job mulai berjalan jika ini adalah list pertama yang diklaim.
                if (!candidate.job.startedAt) {
                    await tx
                        .update(syncJobTable)
                        .set({ status: "processing", startedAt: new Date() })
                        .where(eq(syncJobTable.id, candidate.job.id));
                }

                return { job: candidate.job, list: updatedList };
            });
        } catch (err) {
            console.error(`${LOG_TAG} claimNextList gagal:`, err);
            throw err;
        }
    },

    async isAborted(listId: number): Promise<boolean> {
        try {
            const [list] = await db
                .select({ status: syncListTable.status })
                .from(syncListTable)
                .where(eq(syncListTable.id, listId))
                .limit(1);
            return list?.status === "aborted";
        } catch (err) {
            console.error(`${LOG_TAG} isAborted gagal untuk List #${listId}:`, err);
            throw err;
        }
    },

    async createBatches(batches: SyncBatchInsert[]): Promise<void> {
        if (batches.length === 0) return;
        try {
            await db.insert(syncBatchTable).values(
                batches.map((b) => ({
                    listId: b.listId,
                    batchPage: b.batchPage,
                    batchSize: b.batchSize,
                    createdBy: b.createdBy,
                })),
            );
        } catch (err) {
            console.error(`${LOG_TAG} createBatches gagal untuk List #${batches[0]?.listId}:`, err);
            throw err;
        }
    },

    async updateListPrepared(
        listId: number,
        data: { totalBatch: number; resource: Record<string, unknown> },
    ): Promise<void> {
        try {
            await db
                .update(syncListTable)
                .set({ totalBatch: data.totalBatch, resource: data.resource })
                .where(eq(syncListTable.id, listId));
        } catch (err) {
            console.error(`${LOG_TAG} updateListPrepared gagal untuk List #${listId}:`, err);
            throw err;
        }
    },

    async failList(listId: number, error: Error, maxRetry: number): Promise<void> {
        try {
            await db.transaction(async (tx) => {
                const [list] = await tx
                    .select({ retryCount: syncListTable.retryCount, jobId: syncListTable.jobId })
                    .from(syncListTable)
                    .where(eq(syncListTable.id, listId))
                    .for("update");

                if (!list) return;

                const retryCount = list.retryCount + 1;
                const exhausted = retryCount >= maxRetry;

                await tx
                    .update(syncListTable)
                    .set({
                        retryCount,
                        lastError: error.message,
                        status: exhausted ? "failed" : "pending",
                        finishedAt: exhausted ? new Date() : null,
                    })
                    .where(eq(syncListTable.id, listId));

                if (exhausted) {
                    await tx
                        .update(syncJobTable)
                        .set({ failedList: sql`${syncJobTable.failedList} + 1` })
                        .where(eq(syncJobTable.id, list.jobId));
                }
            });
        } catch (err) {
            console.error(`${LOG_TAG} failList gagal dicatat untuk List #${listId} (error asal: ${error.message}):`, err);
            throw err;
        }
    },

    // -------------------------------------------------------------------
    // BATCH WORKER
    // -------------------------------------------------------------------

    async claimNextBatch(): Promise<BatchContext | null> {
        try {
            return await db.transaction(async (tx) => {
                const [candidate] = await tx
                    .select({ batch: syncBatchTable, list: syncListTable, job: syncJobTable })
                    .from(syncBatchTable)
                    .innerJoin(syncListTable, eq(syncBatchTable.listId, syncListTable.id))
                    .innerJoin(syncJobTable, eq(syncListTable.jobId, syncJobTable.id))
                    .where(
                        and(
                            eq(syncBatchTable.status, SyncStatus.Pending),
                            eq(syncJobTable.jobType, SyncJobType.EBMD),
                        ),
                    )
                    .orderBy(syncBatchTable.id)
                    .limit(1)
                    .for("update", { of: syncBatchTable, skipLocked: true });

                if (!candidate) return null;

                const [updatedBatch] = await tx
                    .update(syncBatchTable)
                    .set({ status: "processing", startedAt: new Date() })
                    .where(eq(syncBatchTable.id, candidate.batch.id))
                    .returning();

                return { job: candidate.job, list: candidate.list, batch: updatedBatch };
            });
        } catch (err) {
            console.error(`${LOG_TAG} claimNextBatch gagal:`, err);
            throw err;
        }
    },

    async isBatchAborted(batchId: number): Promise<boolean> {
        try {
            const [row] = await db
                .select({ batchStatus: syncBatchTable.status, listStatus: syncListTable.status })
                .from(syncBatchTable)
                .innerJoin(syncListTable, eq(syncBatchTable.listId, syncListTable.id))
                .where(eq(syncBatchTable.id, batchId));

            return row?.batchStatus === "aborted" || row?.listStatus === "aborted";
        } catch (err) {
            console.error(`${LOG_TAG} isBatchAborted gagal untuk Batch #${batchId}:`, err);
            throw err;
        }
    },

    async completeBatch(batchId: number): Promise<void> {
        try {
            await db
                .update(syncBatchTable)
                .set({ status: "completed", finishedAt: new Date() })
                .where(eq(syncBatchTable.id, batchId));
        } catch (err) {
            console.error(`${LOG_TAG} completeBatch gagal untuk Batch #${batchId}:`, err);
            throw err;
        }
    },

    async failBatch(batchId: number, error: Error, maxRetry: number): Promise<void> {
        try {
            await db.transaction(async (tx) => {
                const [batch] = await tx
                    .select({ retryCount: syncBatchTable.retryCount, listId: syncBatchTable.listId })
                    .from(syncBatchTable)
                    .where(eq(syncBatchTable.id, batchId))
                    .for("update");

                if (!batch) return;

                const retryCount = batch.retryCount + 1;
                const exhausted = retryCount >= maxRetry;

                await tx
                    .update(syncBatchTable)
                    .set({
                        retryCount,
                        lastError: error.message,
                        status: exhausted ? "failed" : "pending",
                    })
                    .where(eq(syncBatchTable.id, batchId));

                if (exhausted) {
                    await tx
                        .update(syncListTable)
                        .set({ failedBatch: sql`${syncListTable.failedBatch} + 1` })
                        .where(eq(syncListTable.id, batch.listId));
                }
            });
        } catch (err) {
            console.error(
                `${LOG_TAG} failBatch gagal dicatat untuk Batch #${batchId} (error asal: ${error.message}):`,
                err,
            );
            throw err;
        }
    },

    async incrementListProgress(listId: number): Promise<{ completed: boolean }> {
        try {
            return await db.transaction(async (tx) => {
                const [list] = await tx
                    .update(syncListTable)
                    .set({ completedBatch: sql`${syncListTable.completedBatch} + 1` })
                    .where(eq(syncListTable.id, listId))
                    .returning();

                if (!list) return { completed: false };

                const done = list.completedBatch + list.failedBatch >= list.totalBatch;
                if (done) {
                    await tx
                        .update(syncListTable)
                        .set({ status: "completed", finishedAt: new Date() })
                        .where(eq(syncListTable.id, listId));
                }
                return { completed: done };
            });
        } catch (err) {
            console.error(`${LOG_TAG} incrementListProgress gagal untuk List #${listId}:`, err);
            throw err;
        }
    },

    async incrementJobProgress(jobId: number): Promise<{ completed: boolean }> {
        try {
            return await db.transaction(async (tx) => {
                const [job] = await tx
                    .update(syncJobTable)
                    .set({ completedList: sql`${syncJobTable.completedList} + 1` })
                    .where(eq(syncJobTable.id, jobId))
                    .returning();

                if (!job) return { completed: false };

                const done = job.completedList + job.failedList >= job.totalList;
                if (done) {
                    await tx
                        .update(syncJobTable)
                        .set({ status: "completed", finishedAt: new Date() })
                        .where(eq(syncJobTable.id, jobId));
                }
                return { completed: done };
            });
        } catch (err) {
            console.error(`${LOG_TAG} incrementJobProgress gagal untuk Job #${jobId}:`, err);
            throw err;
        }
    },
};
