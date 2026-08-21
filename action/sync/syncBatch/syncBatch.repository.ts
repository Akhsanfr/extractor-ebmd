import { and, eq, isNull, sql } from "drizzle-orm";
import { db } from "@/drizzle";
import { syncBatchTable } from "@/drizzle/schema/sync/syncBatch";

export const syncBatchRepository = {
    async createMany(
        listId: number,
        batches: { batchSize: number; batchPage: number }[],
        userId: string
    ) {
        if (batches.length === 0) return [];

        return db
            .insert(syncBatchTable)
            .values(
                batches.map((b) => ({
                    listId,
                    batchSize: b.batchSize,
                    batchPage: b.batchPage,
                    createdBy: userId,
                }))
            )
            .returning();
    },

    async findById(id: number) {
        return db.query.syncBatchTable.findFirst({
            where: eq(syncBatchTable.id, id),
        });
    },

    async findByListId(listId: number) {
        return db.query.syncBatchTable.findMany({
            where:
                eq(syncBatchTable.listId, listId)
            ,
            orderBy: syncBatchTable.batchPage,
        });
    },

    async updateStatus(
        id: number,
        status: "pending" | "processing" | "completed" | "failed" | "cancelled",
        extra?: { startedAt?: Date; finishedAt?: Date; abortReason?: string | null }
    ) {
        const [row] = await db
            .update(syncBatchTable)
            .set({ status, ...extra })
            .where(eq(syncBatchTable.id, id))
            .returning();

        return row;
    },

    async incrementRetry(id: number) {
        const [row] = await db
            .update(syncBatchTable)
            .set({
                status: "pending",
                retryCount: sql`${syncBatchTable.retryCount} + 1`,
                startedAt: null,
                finishedAt: null,
                abortReason: null,
            })
            .where(eq(syncBatchTable.id, id))
            .returning();

        return row;
    },
};
