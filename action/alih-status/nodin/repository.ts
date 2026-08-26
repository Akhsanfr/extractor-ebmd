import { eq } from "drizzle-orm";
import { AlihStatusNodinContract } from "./contract";
import { DbOrTx } from "../../baseDbOrTx";
import { alihStatusNodinTable } from "@/drizzle/schema";
import { OperationalError } from "@/action/actionResponse";

export const AlihStatusNodinRepository = {
    async findByGroupId(db: DbOrTx, groupId: number): Promise<AlihStatusNodinContract.SelectDTO> {
        const res = await db.query.alihStatusNodinTable.findFirst({
            where: {
                groupId
            }
        });
        if (!res) {
            throw new OperationalError(`Data Nota Dinas Alih Status dengan ID Persetujuan ${groupId} tidak ditemukan`);
        }
        return res;
    },
    async insert(db: DbOrTx, data: AlihStatusNodinContract.InsertDTO): Promise<void> {
        await db.insert(alihStatusNodinTable).values(data);
    },
    async update(db: DbOrTx, data: AlihStatusNodinContract.UpdateDTO): Promise<void> {
        const { id, ...updateData } = data;
        await db.update(alihStatusNodinTable).set(updateData).where(eq(alihStatusNodinTable.id, id));
    },
    async remove(db: DbOrTx, data: AlihStatusNodinContract.RemoveDTO): Promise<void> {
        const { id } = data;
        await db
            .update(alihStatusNodinTable)
            .set({ deletedAt: data.deletedAt, deletedBy: data.deletedBy })
            .where(eq(alihStatusNodinTable.id, id));
    },
};
