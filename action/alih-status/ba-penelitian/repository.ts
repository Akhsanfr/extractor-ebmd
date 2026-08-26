import { eq } from "drizzle-orm";
import { AlihStatusBAPenelitianContract } from "./contract";
import { DbOrTx } from "../../baseDbOrTx";
import { alihStatusBAPenelitianTable } from "@/drizzle/schema";

export const AlihStatusBAPenelitianRepository = {
    async findAll(db: DbOrTx): Promise<AlihStatusBAPenelitianContract.SelectDTO[]> {
        return await db.query.alihStatusBAPenelitianTable.findMany();
    },
    async insert(db: DbOrTx, data: AlihStatusBAPenelitianContract.InsertDTO): Promise<void> {
        await db.insert(alihStatusBAPenelitianTable).values(data);
    },
    async update(db: DbOrTx, data: AlihStatusBAPenelitianContract.UpdateDTO): Promise<void> {
        const { id, ...updateData } = data;
        await db.update(alihStatusBAPenelitianTable).set(updateData).where(eq(alihStatusBAPenelitianTable.id, id));
    },
    async remove(db: DbOrTx, data: AlihStatusBAPenelitianContract.RemoveDTO): Promise<void> {
        const { id } = data;
        await db
            .update(alihStatusBAPenelitianTable)
            .set({ deletedAt: data.deletedAt, deletedBy: data.deletedBy })
            .where(eq(alihStatusBAPenelitianTable.id, id));
    },
};
