import { eq } from "drizzle-orm";
import { AlihStatusPersetujuanBupatiContract } from "./contract";
import { DbOrTx } from "../../baseDbOrTx";
import { alihStatusPersetujuanBupatiTable } from "@/drizzle/schema";
import { OperationalError } from "@/action/actionResponse";

export const AlihStatusPersetujuanBupatiRepository = {
    async findByGroupId(db: DbOrTx, groupId: number): Promise<AlihStatusPersetujuanBupatiContract.SelectDTO> {
        const res = await db.query.alihStatusPersetujuanBupatiTable.findFirst({
            where: {
                groupId
            }
        });
        if (!res) {
            throw new OperationalError(`Data Persetujuan Alih Status dengan ID Persetujuan ${groupId} tidak ditemukan`);
        }
        return res;
    },
    async insert(db: DbOrTx, data: AlihStatusPersetujuanBupatiContract.InsertDTO): Promise<void> {
        await db.insert(alihStatusPersetujuanBupatiTable).values(data);
    },
    async update(db: DbOrTx, data: AlihStatusPersetujuanBupatiContract.UpdateDTO): Promise<void> {
        const { id, ...updateData } = data;
        await db.update(alihStatusPersetujuanBupatiTable).set(updateData).where(eq(alihStatusPersetujuanBupatiTable.id, id));
    },
    async remove(db: DbOrTx, data: AlihStatusPersetujuanBupatiContract.RemoveDTO): Promise<void> {
        const { id } = data;
        await db
            .update(alihStatusPersetujuanBupatiTable)
            .set({ deletedAt: data.deletedAt, deletedBy: data.deletedBy })
            .where(eq(alihStatusPersetujuanBupatiTable.id, id));
    },
};
