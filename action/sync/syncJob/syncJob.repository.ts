import { and, eq, getTableColumns, isNull, sql } from "drizzle-orm";
import { syncJobTable } from "@/drizzle/schema/sync/syncJob";
import { syncListTable } from "@/drizzle/schema/sync/syncList";
import { syncBatchTable } from "@/drizzle/schema/sync/syncBatch";
import { SyncJobContract } from "./syncJob.contract";
import { DbOrTx } from "@/action/baseDbOrTx";
import { BmdSyncStatus } from "@/enum/bmdSync";

export const syncJobRepository = {
    async create(dbOrTx: DbOrTx, data: SyncJobContract.CreateDTO, userId: string) {
        const [row] = await dbOrTx
            .insert(syncJobTable)
            .values({
                name: data.name,
                jobType: data.jobType,
                createdBy: userId,
            })
            .returning();

        return row;
    },

    async findById(dbOrTx: DbOrTx, id: number) {
        return dbOrTx.query.syncJobTable.findFirst({
            where: eq(syncJobTable.id, id),
        });
    },

    // list job (belum dihapus) + agregat progress batch, untuk dashboard table.
    async findAllWithProgress(dbOrTx: DbOrTx): Promise<SyncJobContract.SelectWithProgressDTO[]> {
        return dbOrTx
            .select({
                ...getTableColumns(syncJobTable),
                totalList: sql<number>`count(distinct ${syncListTable.id})`.mapWith(Number),
                totalBatch: sql<number>`count(${syncBatchTable.id})`.mapWith(Number),
                completedBatch: sql<number>`count(${syncBatchTable.id}) filter (where ${syncBatchTable.status} = 'completed')`.mapWith(Number),
                failedBatch: sql<number>`count(${syncBatchTable.id}) filter (where ${syncBatchTable.status} = 'failed')`.mapWith(Number),
            })
            .from(syncJobTable)
            .leftJoin(
                syncListTable,
                eq(syncListTable.jobId, syncJobTable.id)
            )
            .leftJoin(
                syncBatchTable,
                eq(syncBatchTable.listId, syncListTable.id)
            )
            .groupBy(syncJobTable.id)
            .orderBy(sql`${syncJobTable.createdAt} desc`);
    },

    async updateStatus(
        dbOrTx: DbOrTx,
        id: number,
        status: BmdSyncStatus,
        extra?: { startedAt?: Date; finishedAt?: Date }
    ) {
        const [row] = await dbOrTx
            .update(syncJobTable)
            .set({ status, ...extra })
            .where(eq(syncJobTable.id, id))
            .returning();

        return row;
    },

    async cancel(dbOrTx: DbOrTx, id: number, userId: string, abortReason: string) {
        const [row] = await dbOrTx
            .update(syncJobTable)
            .set({
                status: "aborted",
                abortBy: userId,
                abortAt: new Date(),
                abortReason,
                finishedAt: new Date(),
            })
            .where(eq(syncJobTable.id, id))
            .returning();

        return row;
    },
};
