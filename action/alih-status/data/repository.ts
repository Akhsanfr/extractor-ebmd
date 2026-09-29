import { and, Column, eq,  inArray, isNotNull, isNull, SQL, sql } from "drizzle-orm";
import { AlihStatusDataContract } from "./contract";
import { DbOrTx } from "../../baseDbOrTx";
import { alihStatusDataTable } from "@/drizzle/schema";

const numberFilter = (
    column: Column,
    value: number | number[],
) => {
    return Array.isArray(value)
        ? inArray(column, value)
        : eq(column, value);
};

export const AlihStatusDataRepository = {

    async findByPermohonanId(db: DbOrTx, permohonanId: number): Promise<AlihStatusDataContract.SelectDTO[]> {
        return await db.query.alihStatusDataTable.findMany({
            where: {
                permohonanId
            }
        });
    },
    async find(
        db: DbOrTx,
        query: AlihStatusDataContract.QueryDTO,
    ): Promise<AlihStatusDataContract.SelectDTO[]> {
        const conditions: SQL[] = [];

        if (query.tahun !== undefined) {
            conditions.push(
                numberFilter(
                    alihStatusDataTable.tahun,
                    query.tahun,
                ),
            );
        }

        if (query.spkmbId !== undefined) {
            conditions.push(
                numberFilter(
                    alihStatusDataTable.spkmbId,
                    query.spkmbId,
                ),
            );
        }

        if (query.permohonanId !== undefined) {
            conditions.push(
                numberFilter(
                    alihStatusDataTable.permohonanId,
                    query.permohonanId,
                ),
            );
        }

        if (query.BAPenelitianId !== undefined) {
            conditions.push(
                numberFilter(
                    alihStatusDataTable.BAPenelitianId,
                    query.BAPenelitianId,
                ),
            );
        }

        if (query.nodinId !== undefined) {
            conditions.push(
                numberFilter(
                    alihStatusDataTable.nodinId,
                    query.nodinId,
                ),
            );
        }

        if (query.persetujuanBupatiId !== undefined) {
            conditions.push(
                numberFilter(
                    alihStatusDataTable.persetujuanBupatiId,
                    query.persetujuanBupatiId,
                ),
            );
        }

        if (query.bastId !== undefined) {
            conditions.push(
                numberFilter(
                    alihStatusDataTable.bastId,
                    query.bastId,
                ),
            );
        }

        if (query.permohonanPenghapusanId !== undefined) {
            conditions.push(
                numberFilter(
                    alihStatusDataTable.permohonanPenghapusanId,
                    query.permohonanPenghapusanId,
                ),
            );
        }

        if (query.SKHapusId !== undefined) {
            conditions.push(
                numberFilter(
                    alihStatusDataTable.SKHapusId,
                    query.SKHapusId,
                ),
            );
        }

        return db
            .select()
            .from(alihStatusDataTable)
            .where(and(...conditions));
    },
    async insert(db: DbOrTx, data: AlihStatusDataContract.InsertDTO[]): Promise<AlihStatusDataContract.SelectDTO> {
        return (await db.insert(alihStatusDataTable).values(data).returning())[0];
    },
    async update(db: DbOrTx, data: AlihStatusDataContract.UpdateDTO): Promise<AlihStatusDataContract.SelectDTO> {
        const { id, ...updateData } = data;
        return (await db.update(alihStatusDataTable).set(updateData).where(eq(alihStatusDataTable.id, id)).returning())[0];
    },
    async link(
        db: DbOrTx,
        ids: number[],
        data: AlihStatusDataContract.LinkDTO,
    ): Promise<void> {
        if (ids.length === 0) {
            return;
        }

        const conditions = [
            inArray(alihStatusDataTable.id, ids),
        ];

        if (data.spkmbId !== undefined) {
            conditions.push(
                isNull(alihStatusDataTable.spkmbId),
            );
        }

        if (data.permohonanId !== undefined) {
            conditions.push(
                isNull(alihStatusDataTable.permohonanId),
            );
        }

        if (data.BAPenelitianId !== undefined) {
            conditions.push(
                isNull(alihStatusDataTable.BAPenelitianId),
            );
        }

        if (data.nodinId !== undefined) {
            conditions.push(
                isNull(alihStatusDataTable.nodinId),
            );
        }

        if (data.persetujuanBupatiId !== undefined) {
            conditions.push(
                isNull(alihStatusDataTable.persetujuanBupatiId),
            );
        }

        if (data.bastId !== undefined) {
            conditions.push(
                isNull(alihStatusDataTable.bastId),
            );
        }

        if (data.permohonanPenghapusanId !== undefined) {
            conditions.push(
                isNull(
                    alihStatusDataTable.permohonanPenghapusanId,
                ),
            );
        }

        if (data.SKHapusId !== undefined) {
            conditions.push(
                isNull(alihStatusDataTable.SKHapusId),
            );
        }

        await db
            .update(alihStatusDataTable)
            .set(data)
            .where(and(...conditions));
    },
    async unlink(
        db: DbOrTx,
        ids: number[],
        data: AlihStatusDataContract.UnlinkDTO,
    ): Promise<void> {
        if (ids.length === 0) {
            return;
        }

        const conditions = [
            inArray(alihStatusDataTable.id, ids),
        ];

        const updateData: Partial<AlihStatusDataContract.SelectDTO> = {};

        if (data.spkmbId !== undefined) {
            conditions.push(
                isNotNull(alihStatusDataTable.spkmbId),
            );
            updateData.spkmbId = null;
        }

        if (data.permohonanId !== undefined) {
            conditions.push(
                isNotNull(alihStatusDataTable.permohonanId),
            );
            updateData.permohonanId = null;
        }

        if (data.BAPenelitianId !== undefined) {
            conditions.push(
                isNotNull(alihStatusDataTable.BAPenelitianId),
            );
            updateData.BAPenelitianId = null;
        }

        if (data.nodinId !== undefined) {
            conditions.push(
                isNotNull(alihStatusDataTable.nodinId),
            );
            updateData.nodinId = null;
        }

        if (data.persetujuanBupatiId !== undefined) {
            conditions.push(
                isNotNull(alihStatusDataTable.persetujuanBupatiId),
            );
            updateData.persetujuanBupatiId = null;
        }

        if (data.bastId !== undefined) {
            conditions.push(
                isNotNull(alihStatusDataTable.bastId),
            );
            updateData.bastId = null;
        }

        if (data.permohonanPenghapusanId !== undefined) {
            conditions.push(
                isNotNull(
                    alihStatusDataTable.permohonanPenghapusanId,
                ),
            );
            updateData.permohonanPenghapusanId = null;
        }

        if (data.SKHapusId !== undefined) {
            conditions.push(
                isNotNull(alihStatusDataTable.SKHapusId),
            );
            updateData.SKHapusId = null;
        }

        if (Object.keys(updateData).length === 0) {
            return;
        }

        await db
            .update(alihStatusDataTable)
            .set(updateData)
            .where(and(...conditions));
    },
    async remove(db: DbOrTx, data: AlihStatusDataContract.RemoveDTO): Promise<void> {
        const { id } = data;
        await db
            .delete(alihStatusDataTable)
            .where(eq(alihStatusDataTable.id, id));
    },
};
