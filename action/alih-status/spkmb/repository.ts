import { eq } from "drizzle-orm";
import { AlihStatusSpkmbContract } from "./contract";
import { DbOrTx } from "../../baseDbOrTx";
import { alihStatusSpkmbTable } from "@/drizzle/schema";
import { OperationalError } from "@/action/actionResponse";

export const AlihStatusSpkmbRepository = {
    async findByMasterId(db: DbOrTx, masterId: number): Promise<AlihStatusSpkmbContract.SelectDTO> {
        const res = await db.query.alihStatusSpkmbTable.findFirst({
            where: {
                masterId
            }
        });
        if (!res) {
            throw new OperationalError(`Data SPKMB dengan master id ${masterId} tidak ditemukan`);
        }
        return res;
    },
    async insert(db: DbOrTx, data: AlihStatusSpkmbContract.InsertDTO): Promise<void> {
        await db.insert(alihStatusSpkmbTable).values(data);
    },
    async update(db: DbOrTx, data: AlihStatusSpkmbContract.UpdateDTO): Promise<void> {
        const { id, ...updateData } = data;
        await db.update(alihStatusSpkmbTable).set(updateData).where(eq(alihStatusSpkmbTable.id, id));
    },
    async remove(db: DbOrTx, data: AlihStatusSpkmbContract.RemoveDTO): Promise<void> {
        const { id } = data;
        await db
            .update(alihStatusSpkmbTable)
            .set({ deletedAt: data.deletedAt, deletedBy: data.deletedBy })
            .where(eq(alihStatusSpkmbTable.id, id));
    },
};
