import { eq } from "drizzle-orm";
import { AlihStatusPersetujuanBupatiContract } from "./contract";
import { DbOrTx } from "../../baseDbOrTx";
import { alihStatusPersetujuanBupatiTable } from "@/drizzle/schema";
import { OperationalError } from "@/action/actionResponse";

export const AlihStatusPersetujuanBupatiRepository = {
    async findAll(db: DbOrTx, tahun: number): Promise<AlihStatusPersetujuanBupatiContract.SelectDTO[]> {
        return await db.query.alihStatusPersetujuanBupatiTable.findMany({
            where: {
                tahun
            }
        });
    },
    async findById(db: DbOrTx, id: number): Promise<AlihStatusPersetujuanBupatiContract.SelectDTO> {
        const res = await db.query.alihStatusPersetujuanBupatiTable.findFirst({
            where: { id },
        });
        if (!res) {
            throw new OperationalError(`Data Persetujuan Bupati dengan ID ${id} tidak ditemukan`);
        }
        return res;
    },
    async findByIds(db: DbOrTx, ids: number[]): Promise<AlihStatusPersetujuanBupatiContract.SelectDTO[]> {
        return await db.query.alihStatusPersetujuanBupatiTable.findMany({
            where: {
                id: {
                    in: ids
                }
            }
        });
    },
    async findForAvailableBAST(db: DbOrTx, tahun: number): Promise<AlihStatusPersetujuanBupatiContract.SelectDTO[]> {
        return await db.query.alihStatusPersetujuanBupatiTable.findMany({
            where: {
                tahun,
                data: {
                    persetujuanBupatiId: {
                        isNotNull: true,
                    },
                    bastId: {
                        isNull: true,
                    },
                },
            }
        });
    },
    async insert(db: DbOrTx, data: AlihStatusPersetujuanBupatiContract.InsertDTO): Promise<AlihStatusPersetujuanBupatiContract.SelectDTO> {
        return (await db.insert(alihStatusPersetujuanBupatiTable).values(data).returning())[0];
    },
    async update(db: DbOrTx, data: AlihStatusPersetujuanBupatiContract.UpdateDTO): Promise<AlihStatusPersetujuanBupatiContract.SelectDTO> {
        const { id, ...updateData } = data;
        return (await db.update(alihStatusPersetujuanBupatiTable).set(updateData).where(eq(alihStatusPersetujuanBupatiTable.id, id)).returning())[0];
    },
    async remove(db: DbOrTx, data: AlihStatusPersetujuanBupatiContract.DeleteDTO): Promise<void> {
        await db.delete(alihStatusPersetujuanBupatiTable).where(eq(alihStatusPersetujuanBupatiTable.id, data.id));
    },
};
