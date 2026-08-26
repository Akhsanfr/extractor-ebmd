import { alihStatusGroupPersetujuanMasterTable } from "@/drizzle/schema";
import { createInsertSchema, createSelectSchema } from "drizzle-zod";
import { z } from "zod";
export const AlihStatusGroupPersetujuanMasterContract = {
    select: createSelectSchema(alihStatusGroupPersetujuanMasterTable),

    create: createInsertSchema(alihStatusGroupPersetujuanMasterTable)
        .omit({ createdAt: true, createdBy: true }),
    import: createInsertSchema(alihStatusGroupPersetujuanMasterTable)
        .omit({ createdAt: true, createdBy: true })
        .array(),

    insert: createInsertSchema(alihStatusGroupPersetujuanMasterTable),

    deleteByMasterId: z.object({ masterId: z.number().int().positive() }),
};

export namespace AlihStatusGroupPersetujuanMasterContract {
    export type SelectDTO = z.infer<typeof AlihStatusGroupPersetujuanMasterContract.select>;
    export type CreateDTO = z.infer<typeof AlihStatusGroupPersetujuanMasterContract.create>;
    export type InsertDTO = z.infer<typeof AlihStatusGroupPersetujuanMasterContract.insert>;
    export type DeleteDTO = z.infer<typeof AlihStatusGroupPersetujuanMasterContract.deleteByMasterId>;
}
