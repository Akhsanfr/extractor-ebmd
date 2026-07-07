import { desc, eq, type InferInsertModel } from "drizzle-orm";
import { DbOrTx } from "../baseDbOrTx";
import { bmdSyncTable } from "@/drizzle/schema/bmdSync";
type InsertBmdSync = InferInsertModel<typeof bmdSyncTable>;
type UpdateBmdSync = Partial<Omit<InsertBmdSync, "id">>;

export const bmdSyncRepository = {
    async create(dbOrTx: DbOrTx, data: InsertBmdSync) {
        const [result] = await dbOrTx.insert(bmdSyncTable).values(data).returning();
        return result;
    },

    async getById(dbOrTx: DbOrTx, id: number) {
        const [result] = await dbOrTx
            .select()
            .from(bmdSyncTable)
            .where(eq(bmdSyncTable.id, id));
        return result;
    },

    /** Untuk tabel (2). */
    async getAll(dbOrTx: DbOrTx) {
        return dbOrTx.select().from(bmdSyncTable).orderBy(desc(bmdSyncTable.createdAt));
    },

    async update(dbOrTx: DbOrTx, id: number, data: UpdateBmdSync) {
        const [result] = await dbOrTx
            .update(bmdSyncTable)
            .set({ ...data, updatedAt: new Date() })
            .where(eq(bmdSyncTable.id, id))
            .returning();
        return result;
    },
};