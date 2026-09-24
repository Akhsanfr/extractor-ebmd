import { eq, getColumns, getColumnTable, getTableColumns, isNull, sql } from "drizzle-orm";
import { AlihStatusMasterContract } from "./contract";
import { DbOrTx } from "../../baseDbOrTx";
import { alihStatusDataTable, alihStatusGroupPenghapusanTable, alihStatusGroupPersetujuanTable, alihStatusMasterTable } from "@/drizzle/schema";
import { OperationalError } from "@/action/actionResponse";

export const AlihStatusMasterRepository = {
    async findById(db: DbOrTx, id: number): Promise<AlihStatusMasterContract.SelectDTO> {
        const res = await db.query.alihStatusMasterTable.findFirst({
            where: {
                id
            }
        });
        if (!res) {
            throw new OperationalError(`Data alih status dengan id ${id} tidak ditemukan`);
        }
        return res;
    },
    async findAllWherePersetujuanNull(
        db: DbOrTx,
    ): Promise<AlihStatusMasterContract.SelectDTO[]> {
        return await db.query.alihStatusMasterTable.findMany({
            where: {
                persetujuanId: {
                    isNull: true,
                },
            },
        });
    },


    async findAllWithSumData(db: DbOrTx): Promise<AlihStatusMasterContract.SelectWithSumDataDTO[]> {
        return await db
            .select({
                ...getColumns(alihStatusMasterTable),
                persetujuan: alihStatusGroupPersetujuanTable.nama,
                penghapusan: alihStatusGroupPenghapusanTable.nama,
                totalNilaiPerolehan: sql<number>`
            coalesce(sum(${alihStatusDataTable.nilaiPerolehan}), 0)
        `,
                jumlahBarang: sql<number>`
            coalesce(sum(${alihStatusDataTable.jumlah}), 0)
        `,
            })
            .from(alihStatusMasterTable)
            .leftJoin(
                alihStatusDataTable,
                eq(
                    alihStatusDataTable.masterId,
                    alihStatusMasterTable.id,
                ),
            )
            .leftJoin(
                alihStatusGroupPersetujuanTable,
                eq(
                    alihStatusGroupPersetujuanTable.id,
                    alihStatusMasterTable.persetujuanId,
                )
            )
            .leftJoin(
                alihStatusGroupPenghapusanTable,
                eq(
                    alihStatusGroupPenghapusanTable.id,
                    alihStatusMasterTable.penghapusanId,
                )
            )
            .groupBy(alihStatusMasterTable.id, alihStatusGroupPersetujuanTable.nama, alihStatusGroupPenghapusanTable.nama)
            .orderBy(alihStatusMasterTable.perangkatDaerahAsal);
    },
    async findAllWithSumDataByGroupPersetujuan(
        db: DbOrTx,
        groupId: number,
    ): Promise<AlihStatusMasterContract.SelectWithSumDataByGroupDTO[]> {
        return await db
            .select({
                ...getColumns(alihStatusMasterTable),

                totalNilaiPerolehan: sql<number>`
                coalesce(sum(${alihStatusDataTable.nilaiPerolehan}), 0)
            `,

                jumlahBarang: sql<number>`
                coalesce(sum(${alihStatusDataTable.jumlah}), 0)
            `,
            })
            .from(alihStatusMasterTable)
            .leftJoin(
                alihStatusDataTable,
                eq(
                    alihStatusDataTable.masterId,
                    alihStatusMasterTable.id,
                ),
            )
            .leftJoin(
                alihStatusGroupPersetujuanTable,
                eq(
                    alihStatusGroupPersetujuanTable.id,
                    alihStatusMasterTable.persetujuanId,
                )
            )
            .where(eq(alihStatusGroupPersetujuanTable.id, groupId))
            .groupBy(alihStatusMasterTable.id)
            .orderBy(alihStatusMasterTable.perangkatDaerahAsal);
    },
    async findAll(db: DbOrTx): Promise<AlihStatusMasterContract.SelectDTO[]> {
        return await db.query.alihStatusMasterTable.findMany();
    },
    async insert(db: DbOrTx, data: AlihStatusMasterContract.InsertDTO): Promise<void> {
        await db.insert(alihStatusMasterTable).values(data);
    },
    async update(db: DbOrTx, data: AlihStatusMasterContract.UpdateDTO): Promise<void> {
        const { id, ...updateData } = data;
        await db.update(alihStatusMasterTable).set(updateData).where(eq(alihStatusMasterTable.id, id));
    },
    async connectPersetujuan(db: DbOrTx, data: AlihStatusMasterContract.ConnectGroupDTO): Promise<void> {
        await db.update(alihStatusMasterTable).set({
            persetujuanId: data.groupId
        }).where(eq(alihStatusMasterTable.id, data.masterId));
    },
    async remove(db: DbOrTx, data: AlihStatusMasterContract.RemoveDTO): Promise<void> {
        const { id } = data;
        await db
            .update(alihStatusMasterTable)
            .set({ deletedAt: data.deletedAt, deletedBy: data.deletedBy })
            .where(eq(alihStatusMasterTable.id, id));
    },
};