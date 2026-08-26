import { eq, getColumns, inArray } from "drizzle-orm";
import { AlihStatusDataContract } from "./contract";
import { DbOrTx } from "../../baseDbOrTx";
import { alihStatusDataTable, alihStatusMasterTable } from "@/drizzle/schema";

export const AlihStatusDataRepository = {
    async findByMasterIds(db: DbOrTx, masterIds: number[]): Promise<AlihStatusDataContract.SelectDTO[]> {
        return masterIds.length
            ? await db
                .select({ ...getColumns(alihStatusDataTable), perangkatDaerahAsal: alihStatusMasterTable.perangkatDaerahAsal })
                .from(alihStatusDataTable)
                .innerJoin(
                    alihStatusMasterTable,
                    eq(alihStatusDataTable.masterId, alihStatusMasterTable.id)
                )
                .where(inArray(alihStatusDataTable.masterId, masterIds))
            : [];
    },
    async insert(db: DbOrTx, data: AlihStatusDataContract.InsertDTO[]): Promise<void> {
        await db.insert(alihStatusDataTable).values(data);
    },
    async update(db: DbOrTx, data: AlihStatusDataContract.UpdateDTO): Promise<void> {
        const { id, ...updateData } = data;
        await db.update(alihStatusDataTable).set(updateData).where(eq(alihStatusDataTable.id, id));
    },
    async remove(db: DbOrTx, data: AlihStatusDataContract.RemoveDTO): Promise<void> {
        const { id } = data;
        await db
            .update(alihStatusDataTable)
            .set({ deletedAt: data.deletedAt, deletedBy: data.deletedBy })
            .where(eq(alihStatusDataTable.id, id));
    },
};
