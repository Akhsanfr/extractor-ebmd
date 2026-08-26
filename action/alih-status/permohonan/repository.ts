import { eq } from "drizzle-orm";
import { AlihStatusPermohonanContract } from "./contract";
import { DbOrTx } from "../../baseDbOrTx";
import { alihStatusPermohonanTable } from "@/drizzle/schema";
import { OperationalError } from "@/action/actionResponse";

export const AlihStatusPermohonanRepository = {
    async findByMasterId(db: DbOrTx, masterId: number): Promise<AlihStatusPermohonanContract.SelectDTO> {
        const res = await db.query.alihStatusPermohonanTable.findFirst({
            where: {
                masterId
            }
        });
        if (!res) {
            throw new OperationalError(`Data SPKMB dengan master id ${masterId} tidak ditemukan`);
        }
        return res;
    },
    async insert(db: DbOrTx, data: AlihStatusPermohonanContract.InsertDTO): Promise<void> {
        await db.insert(alihStatusPermohonanTable).values(data);
    },
    async update(db: DbOrTx, data: AlihStatusPermohonanContract.UpdateDTO): Promise<void> {
        const { id, ...updateData } = data;
        await db.update(alihStatusPermohonanTable).set(updateData).where(eq(alihStatusPermohonanTable.id, id));
    },
    async remove(db: DbOrTx, data: AlihStatusPermohonanContract.RemoveDTO): Promise<void> {
        const { id } = data;
        await db
            .update(alihStatusPermohonanTable)
            .set({ deletedAt: data.deletedAt, deletedBy: data.deletedBy })
            .where(eq(alihStatusPermohonanTable.id, id));
    },
};
