import { eq } from "drizzle-orm";
import { AlihStatusPermohonanPenghapusanContract } from "./contract";
import { DbOrTx } from "../../baseDbOrTx";
import { alihStatusPermohonanPenghapusanTable } from "@/drizzle/schema";
import { OperationalError } from "@/action/actionResponse";
import { AlihStatusBASTContract } from "../bast/contract";

export const AlihStatusPermohonanPenghapusanRepository = {
    async findAll(db: DbOrTx, tahun: number): Promise<AlihStatusPermohonanPenghapusanContract.SelectDTO[]> {
        return await db.query.alihStatusPermohonanPenghapusanTable.findMany({
            where: {
                tahun
            }
        });
    },
    async findById(db: DbOrTx, id: number): Promise<AlihStatusPermohonanPenghapusanContract.SelectDTO> {
        const res = await db.query.alihStatusPermohonanPenghapusanTable.findFirst({
            where: { id },
        });
        if (!res) {
            throw new OperationalError(`Data BAST ID ${id} tidak ditemukan`);
        }
        return res;
    },
    async findByIds(db: DbOrTx, ids: number[]): Promise<AlihStatusPermohonanPenghapusanContract.SelectDTO[]> {
        return await db.query.alihStatusPermohonanPenghapusanTable.findMany({
            where: {
                id: {
                    in: ids
                }
            }
        });
    },
    async findForAvailableSKHapus(db: DbOrTx, tahun: number): Promise<AlihStatusPermohonanPenghapusanContract.SelectDTO[]> {
        return await db.query.alihStatusPermohonanPenghapusanTable.findMany({
            where: {
                tahun,
                data: {
                    permohonanPenghapusanId: {
                        isNotNull: true,
                    },
                    SKHapusId: {
                        isNull: true,
                    },
                },
            }
        });
    },
    async insert(db: DbOrTx, data: AlihStatusPermohonanPenghapusanContract.InsertDTO): Promise<AlihStatusPermohonanPenghapusanContract.SelectDTO> {
        const result = await db.insert(alihStatusPermohonanPenghapusanTable).values(data).returning();
        return result[0];
    },
    async update(db: DbOrTx, data: AlihStatusPermohonanPenghapusanContract.UpdateDTO): Promise<AlihStatusPermohonanPenghapusanContract.SelectDTO> {
        const { id, ...updateData } = data;
        return (await db.update(alihStatusPermohonanPenghapusanTable).set(updateData).where(eq(alihStatusPermohonanPenghapusanTable.id, id)).returning())[0];
    },
    async remove(db: DbOrTx, data: AlihStatusBASTContract.DeleteDTO): Promise<void> {
        await db.delete(alihStatusPermohonanPenghapusanTable).where(eq(alihStatusPermohonanPenghapusanTable.id, data.id));
    },
};
