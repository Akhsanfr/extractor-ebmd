import { eq, inArray } from "drizzle-orm";
import { AlihStatusBASTContract } from "./contract";
import { DbOrTx } from "../../baseDbOrTx";
import { alihStatusBASTTable } from "@/drizzle/schema";
import { OperationalError } from "@/action/actionResponse";

export const AlihStatusBASTRepository = {
    async findAll(db: DbOrTx, tahun: number): Promise<AlihStatusBASTContract.SelectDTO[]> {
        return await db.query.alihStatusBASTTable.findMany({
            where: {
                tahun
            }
        });
    },
    async findById(db: DbOrTx, id: number): Promise<AlihStatusBASTContract.SelectDTO> {
        const res = await db.query.alihStatusBASTTable.findFirst({
            where: { id },
        });
        if (!res) {
            throw new OperationalError(`Data BAST ID ${id} tidak ditemukan`);
        }
        return res;
    },
    async findByIds(db: DbOrTx, ids: number[]): Promise<AlihStatusBASTContract.SelectDTO[]> {
        return await db.query.alihStatusBASTTable.findMany({
            where: {
                id: {
                    in: ids
                }
            }
        });
    },
    async findForAvailablePermohonanPenghapusan(db: DbOrTx, tahun: number): Promise<AlihStatusBASTContract.SelectDTO[]> {
        return await db.query.alihStatusBASTTable.findMany({
            where: {
                tahun,
                data: {
                    bastId: {
                        isNotNull: true,
                    },
                    permohonanPenghapusanId: {
                        isNull: true,
                    },
                },
            }
        });
    },
    async insert(
        db: DbOrTx,
        data: AlihStatusBASTContract.InsertDTO,
    ): Promise<AlihStatusBASTContract.SelectDTO> {
        const normalizedData = {
            ...data,
            suratTanggal: data.suratTanggal === "" ? null : data.suratTanggal,
        };

        return (
            await db
                .insert(alihStatusBASTTable)
                .values(normalizedData)
                .returning()
        )[0];
    },
    async update(
        db: DbOrTx,
        data: AlihStatusBASTContract.UpdateDTO,
    ): Promise<AlihStatusBASTContract.SelectDTO> {
        const { id, ...updateData } = data;

        const normalizedData = {
            ...updateData,
            suratTanggal: updateData.suratTanggal === "" ? null : updateData.suratTanggal,
        };

        return (
            await db
                .update(alihStatusBASTTable)
                .set(normalizedData)
                .where(eq(alihStatusBASTTable.id, id))
                .returning()
        )[0];
    },
    async remove(db: DbOrTx, data: AlihStatusBASTContract.DeleteDTO): Promise<void> {
        await db.delete(alihStatusBASTTable).where(eq(alihStatusBASTTable.id, data.id));
    },
};
