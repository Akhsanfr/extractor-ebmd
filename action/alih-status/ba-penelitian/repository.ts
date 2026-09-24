import { eq, isNotNull } from "drizzle-orm";
import { AlihStatusBAPenelitianContract } from "./contract";
import { DbOrTx } from "../../baseDbOrTx";
import { alihStatusBAPenelitianTable } from "@/drizzle/schema";
import { OperationalError } from "@/action/actionResponse";
import BaPenelitian from "@/app/dashboard/alih-status/ba-penelitian/page";

export const AlihStatusBAPenelitianRepository = {
    async findAll(db: DbOrTx, tahun: number): Promise<AlihStatusBAPenelitianContract.SelectDTO[]> {
        return await db.query.alihStatusBAPenelitianTable.findMany({
            where: {
                tahun
            }, orderBy: (table, { desc }) => [desc(table.id)],
        });
    },
    async findById(db: DbOrTx, id: number): Promise<AlihStatusBAPenelitianContract.SelectDTO> {
        const res = await db.query.alihStatusBAPenelitianTable.findFirst({
            where: { id },
        });
        if (!res) {
            throw new OperationalError(`Data BA Penelitian dengan ID ${id} tidak ditemukan`);
        }
        return res;
    },
    async findByIds(db: DbOrTx, ids: number[]): Promise<AlihStatusBAPenelitianContract.SelectDTO[]> {
        return await db.query.alihStatusBAPenelitianTable.findMany({
            where: {
                id: {
                    in: ids
                }
            }
        });
    },
    async findForAvailableNodin(db: DbOrTx, tahun: number): Promise<AlihStatusBAPenelitianContract.SelectDTO[]> {
        return await db.query.alihStatusBAPenelitianTable.findMany({
            where: {
                tahun,
                data: {
                    BAPenelitianId: {
                        isNotNull: true,
                    },
                    nodinId: {
                        isNull: true,
                    },
                },
            }
        });
    },
    async insert(db: DbOrTx, data: AlihStatusBAPenelitianContract.InsertDTO): Promise<AlihStatusBAPenelitianContract.SelectDTO> {
        const res = await db.insert(alihStatusBAPenelitianTable).values(data).returning();
        return res[0];
    },
    async update(db: DbOrTx, data: AlihStatusBAPenelitianContract.UpdateDTO): Promise<AlihStatusBAPenelitianContract.SelectDTO> {
        const { id, ...updateData } = data;
        const result = await db.update(alihStatusBAPenelitianTable).set(updateData).where(eq(alihStatusBAPenelitianTable.id, id)).returning();
        return result[0];
    },
    async remove(db: DbOrTx, data: AlihStatusBAPenelitianContract.RemoveDTO): Promise<void> {
        await db.delete(alihStatusBAPenelitianTable).where(eq(alihStatusBAPenelitianTable.id, data.id));
    },
};
