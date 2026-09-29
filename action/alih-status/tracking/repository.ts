import { eq } from "drizzle-orm";
import { DbOrTx } from "../../baseDbOrTx";
import { AlihStatusTrackingContract } from "./contract";
import { alihStatusTrackingTable } from "@/drizzle/schema";
import { AlihStatusTrackingSourceType } from "@/enum/alihStatus";
export const AlihStatusTrackingRepository = {
    async create(db: DbOrTx, data: AlihStatusTrackingContract.InsertDTO) {
        const [row] = await db.insert(alihStatusTrackingTable).values(data).returning();
        return row;
    },

    async findBySource(db: DbOrTx, query: AlihStatusTrackingContract.QueryDTO): Promise<AlihStatusTrackingContract.SelectDTO[]> {
        return db.query.alihStatusTrackingTable.findMany({
            where: {
                sourceId: query.sourceId,
                sourceType: query.sourceType
            }
        })
    },

    async update(db: DbOrTx, data: AlihStatusTrackingContract.UpdateDTO) {
        const { id, ...rest } = data;
        const [row] = await db
            .update(alihStatusTrackingTable)
            .set({ ...rest, updatedAt: new Date() })
            .where(eq(alihStatusTrackingTable.id, id))
            .returning();
        return row ?? null;
    },
};