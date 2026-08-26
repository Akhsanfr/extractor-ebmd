import { eq } from "drizzle-orm";
import { AlihStatusPermohonanPenghapusanContract } from "./contract";
import { DbOrTx } from "../../baseDbOrTx";
import { alihStatusPermohonanPenghapusanTable } from "@/drizzle/schema";

export const AlihStatusPermohonanPenghapusanRepository = {
    async findAll(db: DbOrTx): Promise<AlihStatusPermohonanPenghapusanContract.SelectDTO[]> {
        return await db.query.alihStatusPermohonanPenghapusanTable.findMany();
    },
    async insert(db: DbOrTx, data: AlihStatusPermohonanPenghapusanContract.InsertDTO): Promise<void> {
        await db.insert(alihStatusPermohonanPenghapusanTable).values(data);
    },
    async update(db: DbOrTx, data: AlihStatusPermohonanPenghapusanContract.UpdateDTO): Promise<void> {
        const { id, ...updateData } = data;
        await db.update(alihStatusPermohonanPenghapusanTable).set(updateData).where(eq(alihStatusPermohonanPenghapusanTable.id, id));
    },
    async remove(db: DbOrTx, data: AlihStatusPermohonanPenghapusanContract.RemoveDTO): Promise<void> {
        const { id } = data;
        await db
            .update(alihStatusPermohonanPenghapusanTable)
            .set({ deletedAt: data.deletedAt, deletedBy: data.deletedBy })
            .where(eq(alihStatusPermohonanPenghapusanTable.id, id));
    },
};
