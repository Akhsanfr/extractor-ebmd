import { alihStatusSpkmbTable } from "@/drizzle/schema";
import { PerangkatDaerah } from "@/enum/perangkatDaerah";
import { createInsertSchema, createSelectSchema } from "drizzle-zod";
import { z } from "zod";

export const AlihStatusSPKMBContract = {

    query: z.object({
        masterIds: z.number().array()
    }),
    select: createSelectSchema(alihStatusSpkmbTable).extend({ perangkatDaerahTujuan: z.enum(PerangkatDaerah) }),

    create: createInsertSchema(alihStatusSpkmbTable)
        .extend({ dataIds: z.number().int().positive().array() })
        .omit({ createdAt: true, createdBy: true }),
    insert: createInsertSchema(alihStatusSpkmbTable)
        .extend({ dataIds: z.number().int().positive().array() }),

    edit: createInsertSchema(alihStatusSpkmbTable)
        .extend({ id: z.number().int().positive() })
        .omit({ createdAt: true, createdBy: true }),
    update: createInsertSchema(alihStatusSpkmbTable)
        .extend({ id: z.number().int().positive(), createdBy: z.string(), updatedAt: z.date(), updatedBy: z.string() })
        .omit({ createdAt: true, createdBy: true }),

    delete: z.object({ id: z.number().int().positive() }),
    remove: z.object({
        id: z.number().int().positive(),
    }),
};

export namespace AlihStatusSPKMBContract {
    export type QueryDTO = z.infer<typeof AlihStatusSPKMBContract.query>;
    export type SelectDTO = z.infer<typeof AlihStatusSPKMBContract.select>;
    export type CreateDTO = z.infer<typeof AlihStatusSPKMBContract.create>;
    export type InsertDTO = z.infer<typeof AlihStatusSPKMBContract.insert>;
    export type EditDTO = z.infer<typeof AlihStatusSPKMBContract.edit>;
    export type UpdateDTO = z.infer<typeof AlihStatusSPKMBContract.update>;
    export type DeleteDTO = z.infer<typeof AlihStatusSPKMBContract.delete>;
    export type RemoveDTO = z.infer<typeof AlihStatusSPKMBContract.remove>;
}
