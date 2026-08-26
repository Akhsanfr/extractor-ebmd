import { eq } from "drizzle-orm";
import { AlihStatusGroupPersetujuanContract } from "./contract";
import { DbOrTx } from "../../baseDbOrTx";
import { alihStatusGroupPersetujuanTable } from "@/drizzle/schema";
import { OperationalError } from "@/action/actionResponse";

export const AlihStatusGroupPersetujuanRepository = {
    async findById(db: DbOrTx, id: number): Promise<AlihStatusGroupPersetujuanContract.SelectDTO> {
        const res = await db.query.alihStatusGroupPersetujuanTable.findFirst({
            where: {
                id
            }
        });
        if (!res) {
            throw new OperationalError(`Data alih status dengan id ${id} tidak ditemukan`);
        }
        return res;
    },
    async findAll(db: DbOrTx): Promise<AlihStatusGroupPersetujuanContract.SelectDTO[]> {
        return await db.query.alihStatusGroupPersetujuanTable.findMany();
    },
    async insert(db: DbOrTx, data: AlihStatusGroupPersetujuanContract.InsertDTO): Promise<void> {
        await db.insert(alihStatusGroupPersetujuanTable).values(data);
    },
    async update(db: DbOrTx, data: AlihStatusGroupPersetujuanContract.UpdateDTO): Promise<void> {
        const { id, ...updateData } = data;
        await db.update(alihStatusGroupPersetujuanTable).set(updateData).where(eq(alihStatusGroupPersetujuanTable.id, id));
    },
    async remove(db: DbOrTx, data: AlihStatusGroupPersetujuanContract.RemoveDTO): Promise<void> {
        const { id } = data;
        await db
            .update(alihStatusGroupPersetujuanTable)
            .set({ deletedAt: data.deletedAt, deletedBy: data.deletedBy })
            .where(eq(alihStatusGroupPersetujuanTable.id, id));
    },
};
