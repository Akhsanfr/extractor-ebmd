import { and, asc, eq, inArray, sql, type InferInsertModel } from "drizzle-orm";
import { bmdSubSyncTable } from "@/drizzle/schema/bmdSubSync";
import { DbOrTx } from "../baseDbOrTx";

type InsertBmdSubSync = InferInsertModel<typeof bmdSubSyncTable>;
type UpdateBmdSubSync = Partial<Omit<InsertBmdSubSync, "id" | "syncId">>;

export const bmdSubSyncRepository = {
    async createMany(dbOrTx: DbOrTx, data: InsertBmdSubSync[]) {
        if (data.length === 0) return [];
        return dbOrTx.insert(bmdSubSyncTable).values(data).returning();
    },

    async getById(dbOrTx: DbOrTx, id: number) {
        const [result] = await dbOrTx
            .select()
            .from(bmdSubSyncTable)
            .where(eq(bmdSubSyncTable.id, id));
        return result;
    },

    /** Untuk tabel (3): daftar sub-sync per sync list, diurutkan sesuai urutan pembuatan. */
    async getBySyncId(dbOrTx: DbOrTx, syncId: number) {
        return dbOrTx
            .select()
            .from(bmdSubSyncTable)
            .where(eq(bmdSubSyncTable.syncId, syncId))
            .orderBy(asc(bmdSubSyncTable.id));
    },

    /** Sub-sync yang masih perlu diproses saat play/resume: pending, stopped, atau failed (retry direset). */
    async getResumable(dbOrTx: DbOrTx, syncId: number) {
        return dbOrTx
            .select()
            .from(bmdSubSyncTable)
            .where(
                and(
                    eq(bmdSubSyncTable.syncId, syncId),
                    inArray(bmdSubSyncTable.status, ["pending", "stopped", "failed"]),
                ),
            )
            .orderBy(asc(bmdSubSyncTable.id));
    },

    async update(dbOrTx: DbOrTx, id: number, data: UpdateBmdSubSync) {
        const [result] = await dbOrTx
            .update(bmdSubSyncTable)
            .set({ ...data, updatedAt: new Date() })
            .where(eq(bmdSubSyncTable.id, id))
            .returning();
        return result;
    },

    async requestStop(dbOrTx: DbOrTx, id: number) {
        return this.update(dbOrTx, id, { stopRequested: true });
    },

    /** Agregat untuk menghitung status akhir bmd_sync. */
    async getAggregateCounts(dbOrTx: DbOrTx, syncId: number) {
        const rows = await dbOrTx
            .select({
                status: bmdSubSyncTable.status,
                count: sql<number>`count(*)`.as("count"),
            })
            .from(bmdSubSyncTable)
            .where(eq(bmdSubSyncTable.syncId, syncId))
            .groupBy(bmdSubSyncTable.status);

        const counts = { pending: 0, running: 0, stopped: 0, success: 0, failed: 0 };
        for (const row of rows) {
            counts[row.status] = Number(row.count);
        }
        return counts;
    },
};