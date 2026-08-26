import { eq } from "drizzle-orm";
import { AlihStatusGroupPersetujuanMasterContract } from "./contract";
import { DbOrTx } from "../../baseDbOrTx";
import { alihStatusGroupPersetujuanMasterTable } from "@/drizzle/schema";

export const AlihStatusGroupPersetujuanMasterRepository = {
    async findAll(db: DbOrTx): Promise<AlihStatusGroupPersetujuanMasterContract.SelectDTO[]> {
        return await db.query.alihStatusGroupPersetujuanMasterTable.findMany();
    },
    async insert(db: DbOrTx, data: AlihStatusGroupPersetujuanMasterContract.InsertDTO): Promise<void> {
        await db.insert(alihStatusGroupPersetujuanMasterTable).values(data);
    },
    async removeByMasterId(db: DbOrTx, data: AlihStatusGroupPersetujuanMasterContract.DeleteDTO): Promise<void> {
        const { masterId } = data;
        // Hard delete: this junction table has no soft-delete columns.
        await db.delete(alihStatusGroupPersetujuanMasterTable).where(eq(alihStatusGroupPersetujuanMasterTable.id, masterId));
    },
};
