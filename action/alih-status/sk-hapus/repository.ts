import { eq } from "drizzle-orm";
import { AlihStatusSKHapusContract } from "./contract";
import { DbOrTx } from "../../baseDbOrTx";
import { alihStatusSKHapusTable } from "@/drizzle/schema";
import { OperationalError } from "@/action/actionResponse";

export const AlihStatusSKHapusRepository = {
    async findAll(db: DbOrTx, tahun: number): Promise<AlihStatusSKHapusContract.SelectDTO[]> {
        return await db.query.alihStatusSKHapusTable.findMany({
            where: {
                tahun
            }
        });
    },
    async findById(db: DbOrTx, id: number): Promise<AlihStatusSKHapusContract.SelectDTO> {
        const res = await db.query.alihStatusSKHapusTable.findFirst({
            where: { id },
        });
        if (!res) {
            throw new OperationalError(`Data SK Hapus dengan ID ${id} tidak ditemukan`);
        }
        return res;
    },
    async findByIds(db: DbOrTx, ids: number[]): Promise<AlihStatusSKHapusContract.SelectDTO[]> {
        return await db.query.alihStatusSKHapusTable.findMany({
            where: {
                id: {
                    in: ids
                }
            }
        });
    },
    async insert(db: DbOrTx, data: AlihStatusSKHapusContract.InsertDTO): Promise<AlihStatusSKHapusContract.SelectDTO> {
        return (await db.insert(alihStatusSKHapusTable).values(data).returning())[0];
    },
    async update(db: DbOrTx, data: AlihStatusSKHapusContract.UpdateDTO): Promise<AlihStatusSKHapusContract.SelectDTO> {
        const { id, ...updateData } = data;
        return (await db.update(alihStatusSKHapusTable).set(updateData).where(eq(alihStatusSKHapusTable.id, id)).returning())[0]
    },
    async remove(db: DbOrTx, data: AlihStatusSKHapusContract.DeleteDTO): Promise<void> {
        await db.delete(alihStatusSKHapusTable).where(eq(alihStatusSKHapusTable.id, data.id));
    },
};
