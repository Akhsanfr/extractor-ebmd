import { eq, isNotNull } from "drizzle-orm";
import { AlihStatusPermohonanContract } from "./contract";
import { DbOrTx } from "../../baseDbOrTx";
import { alihStatusPermohonanTable } from "@/drizzle/schema";
import { OperationalError } from "@/action/actionResponse";
import { AlihStatusType } from "@/enum/alihStatus";

export const AlihStatusPermohonanRepository = {
    async findById(db: DbOrTx, id: number): Promise<AlihStatusPermohonanContract.SelectDTO> {
        const res = await db.query.alihStatusPermohonanTable.findFirst({
            where: {
                id,
            }
        });
        if (!res) {
            throw new OperationalError(`Data SPKMB dengan master id ${id} tidak ditemukan`);
        }
        return res;
    },
    async findByIds(db: DbOrTx, ids: number[]): Promise<AlihStatusPermohonanContract.SelectDTO[]> {
        return await db.query.alihStatusPermohonanTable.findMany({
            where: {
                id: {
                    in: ids
                }
            }
        });
    },
    async find(
        db: DbOrTx,
        query: AlihStatusPermohonanContract.QueryDTO,
    ): Promise<AlihStatusPermohonanContract.SelectDTO[]> {
        const pengelola = "Pengelola Barang Milik Daerah";

        const where =
            query.alihStatusType ===
                AlihStatusType.PENYERAHAN_KEPADA_PENGELOLA
                ? {
                    tahun: query.tahun,
                    data: {
                        perangkatDaerahTujuan: pengelola,
                    },
                }
                : query.alihStatusType ===
                    AlihStatusType.PENGALIHAN_STATUS_PENGGUNAAN_DARI_PENGELOLA
                    ? {
                        tahun: query.tahun,
                        data: {
                            perangkatDaerahAsal: pengelola,
                        },
                    }
                    : {
                        tahun: query.tahun,
                        data: {
                            perangkatDaerahAsal: { ne: pengelola },
                            perangkatDaerahTujuan: { ne: pengelola },
                        },
                    };

        return await db.query.alihStatusPermohonanTable.findMany({
            where,
            orderBy: {
                id: "desc",
            },
        });
    },
    async findForAvailableBaPenelitian(db: DbOrTx, tahun: number): Promise<AlihStatusPermohonanContract.SelectDTO[]> {
        return await db.query.alihStatusPermohonanTable.findMany({
            where: {
                tahun,
                alihStatusType: {
                    ne: AlihStatusType.PENYERAHAN_KEPADA_PENGELOLA
                },
                data: {
                    BAPenelitianId: {
                        isNull: true,
                    },
                },
            }
        });
    },

    async insert(db: DbOrTx, data: AlihStatusPermohonanContract.InsertDTO): Promise<AlihStatusPermohonanContract.SelectDTO> {
        const res = await db.insert(alihStatusPermohonanTable).values(data).returning();
        return res[0];
    },
    async update(db: DbOrTx, data: AlihStatusPermohonanContract.UpdateDTO): Promise<AlihStatusPermohonanContract.SelectDTO> {
        const { id, ...updateData } = data;
        const res = await db.update(alihStatusPermohonanTable).set(updateData).where(eq(alihStatusPermohonanTable.id, id)).returning();
        return res[0];
    },
    async remove(db: DbOrTx, data: AlihStatusPermohonanContract.RemoveDTO): Promise<void> {
        const { id } = data;
        await db
            .update(alihStatusPermohonanTable)
            .set({ deletedAt: data.deletedAt, deletedBy: data.deletedBy })
            .where(eq(alihStatusPermohonanTable.id, id));
    },
};
