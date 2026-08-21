import { and, eq, getTableColumns, isNull, sql } from "drizzle-orm";
import { db } from "@/drizzle";
import { syncListTable } from "@/drizzle/schema/sync/syncList";
import { syncBatchTable } from "@/drizzle/schema/sync/syncBatch";
import { SyncListContract } from "./syncList.contract";
import { DbOrTx } from "@/action/baseDbOrTx";

export const syncListRepository = {
    async create(
        dbOrTx: DbOrTx,
        data: SyncListContract.CreateDTO[],
    ) {
        const [row] = await dbOrTx
            .insert(syncListTable)
            .values(data)
            .returning();

        return row;
    },

    async findById(id: number) {
        return db.query.syncListTable.findFirst({
            where: eq(syncListTable.id, id),
        });
    },

    async findByJobIdWithProgress(jobId: number): Promise<SyncListContract.SelectWithProgressDTO[]> {
        return db
            .select({
                ...getTableColumns(syncListTable),
                totalBatch: sql<number>`count(${syncBatchTable.id})`.mapWith(Number),
                completedBatch: sql<number>`count(${syncBatchTable.id}) filter (where ${syncBatchTable.status} = 'completed')`.mapWith(Number),
                failedBatch: sql<number>`count(${syncBatchTable.id}) filter (where ${syncBatchTable.status} = 'failed')`.mapWith(Number),
            })
            .from(syncListTable)
            .leftJoin(
                syncBatchTable,
                eq(syncBatchTable.listId, syncListTable.id)
            )
            .where(eq(syncListTable.jobId, jobId),)
            .groupBy(syncListTable.id)
            .orderBy(syncListTable.id);
    },

    async updateEndpoint(id: number, data: SyncListContract.EditDTO) {
        const [row] = await db
            .update(syncListTable)
            .set({ ...data })
            .where(eq(syncListTable.id, id))
            .returning();

        return row;
    },

    async updateStatus(
        id: number,
        status: "pending" | "processing" | "completed" | "failed" | "cancelled",
        extra?: { lastError?: string | null; startedAt?: Date; finishedAt?: Date }
    ) {
        const [row] = await db
            .update(syncListTable)
            .set({ status, ...extra })
            .where(eq(syncListTable.id, id))
            .returning();

        return row;
    },
};
