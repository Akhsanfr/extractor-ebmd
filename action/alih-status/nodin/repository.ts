import { eq } from "drizzle-orm";
import { AlihStatusNodinContract } from "./contract";
import { DbOrTx } from "../../baseDbOrTx";
import { alihStatusNodinTable } from "@/drizzle/schema";
import { OperationalError } from "@/action/actionResponse";

export const AlihStatusNodinRepository = {
    async findAll(db: DbOrTx, tahun: number): Promise<AlihStatusNodinContract.SelectDTO[]> {
        return await db.query.alihStatusNodinTable.findMany({
            where: {
                tahun
            }
        });
    },
    async findById(db: DbOrTx, id: number): Promise<AlihStatusNodinContract.SelectDTO> {
        const res = await db.query.alihStatusNodinTable.findFirst({
            where: { id },
        });
        if (!res) {
            throw new OperationalError(`Data BA Penelitian dengan ID ${id} tidak ditemukan`);
        }
        return res;
    },
    async findByIds(db: DbOrTx, ids: number[]): Promise<AlihStatusNodinContract.SelectDTO[]> {
        return await db.query.alihStatusNodinTable.findMany({
            where: {
                id: {
                    in: ids
                }
            }
        });
    },
    async findForAvailablePersetujuanBupati(db: DbOrTx, tahun: number): Promise<AlihStatusNodinContract.SelectDTO[]> {
        return await db.query.alihStatusNodinTable.findMany({
            where: {
                tahun,
                data: {
                    nodinId: {
                        isNotNull: true,
                    },
                    persetujuanBupatiId: {
                        isNull: true,
                    },
                },
            }
        });
    },
    async insert(db: DbOrTx, data: AlihStatusNodinContract.InsertDTO): Promise<AlihStatusNodinContract.SelectDTO> {
        const res = await db.insert(alihStatusNodinTable).values(data).returning();
        return res[0];
    },
    async update(db: DbOrTx, data: AlihStatusNodinContract.UpdateDTO): Promise<AlihStatusNodinContract.SelectDTO> {
        const { id, ...updateData } = data;
        const result = await db.update(alihStatusNodinTable).set(updateData).where(eq(alihStatusNodinTable.id, id)).returning();
        return result[0];
    },
    async remove(db: DbOrTx, data: AlihStatusNodinContract.RemoveDTO): Promise<void> {
        await db.delete(alihStatusNodinTable).where(eq(alihStatusNodinTable.id, data.id));
    },
};
