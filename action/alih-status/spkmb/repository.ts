import { eq } from "drizzle-orm";
import { AlihStatusSPKMBContract } from "./contract";
import { DbOrTx } from "../../baseDbOrTx";
import { alihStatusSpkmbTable } from "@/drizzle/schema";

export const AlihStatusSpkmbRepository = {
    async findByIds(db: DbOrTx, ids: number[]): Promise<AlihStatusSPKMBContract.SelectDTO[]> {
        return await db.query.alihStatusSpkmbTable.findMany({
            where: {
                id: {
                    in: ids
                }
            }
        });
    },
    async insert(db: DbOrTx, data: AlihStatusSPKMBContract.InsertDTO): Promise<AlihStatusSPKMBContract.SelectDTO> {
        const result = await db.insert(alihStatusSpkmbTable).values(data).returning();
        return result[0];
    },
    async update(db: DbOrTx, data: AlihStatusSPKMBContract.UpdateDTO): Promise<AlihStatusSPKMBContract.SelectDTO> {
        const { id, ...updateData } = data;
        const result = await db.update(alihStatusSpkmbTable).set(updateData).where(eq(alihStatusSpkmbTable.id, id)).returning();
        return result[0];
    },
    async remove(db: DbOrTx, data: AlihStatusSPKMBContract.RemoveDTO): Promise<void> {
        await db.delete(alihStatusSpkmbTable).where(eq(alihStatusSpkmbTable.id, data.id));
    },
};
