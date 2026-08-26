import { eq } from "drizzle-orm";
import { AlihStatusSKHapusContract } from "./contract";
import { DbOrTx } from "../../baseDbOrTx";
import { alihStatusSKHapusTable } from "@/drizzle/schema";

export const AlihStatusSKHapusRepository = {
    async findAll(db: DbOrTx): Promise<AlihStatusSKHapusContract.SelectDTO[]> {
        return await db.query.alihStatusSKHapusTable.findMany();
    },
    async insert(db: DbOrTx, data: AlihStatusSKHapusContract.InsertDTO): Promise<void> {
        await db.insert(alihStatusSKHapusTable).values(data);
    },
    async update(db: DbOrTx, data: AlihStatusSKHapusContract.UpdateDTO): Promise<void> {
        const { id, ...updateData } = data;
        await db.update(alihStatusSKHapusTable).set(updateData).where(eq(alihStatusSKHapusTable.id, id));
    },
    async remove(db: DbOrTx, data: AlihStatusSKHapusContract.RemoveDTO): Promise<void> {
        const { id } = data;
        await db
            .update(alihStatusSKHapusTable)
            .set({ deletedAt: data.deletedAt, deletedBy: data.deletedBy })
            .where(eq(alihStatusSKHapusTable.id, id));
    },
};
