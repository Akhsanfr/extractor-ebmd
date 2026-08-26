import { eq } from "drizzle-orm";
import { AlihStatusBASTContract } from "./contract";
import { DbOrTx } from "../../baseDbOrTx";
import { alihStatusBASTTable } from "@/drizzle/schema";

export const AlihStatusBASTRepository = {
    async findAll(db: DbOrTx): Promise<AlihStatusBASTContract.SelectDTO[]> {
        return await db.query.alihStatusBASTTable.findMany();
    },
    async insert(db: DbOrTx, data: AlihStatusBASTContract.InsertDTO): Promise<void> {
        await db.insert(alihStatusBASTTable).values(data);
    },
    async update(db: DbOrTx, data: AlihStatusBASTContract.UpdateDTO): Promise<void> {
        const { id, ...updateData } = data;
        await db.update(alihStatusBASTTable).set(updateData).where(eq(alihStatusBASTTable.id, id));
    },
    async remove(db: DbOrTx, data: AlihStatusBASTContract.RemoveDTO): Promise<void> {
        const { id } = data;
        await db
            .update(alihStatusBASTTable)
            .set({ deletedAt: data.deletedAt, deletedBy: data.deletedBy })
            .where(eq(alihStatusBASTTable.id, id));
    },
};
