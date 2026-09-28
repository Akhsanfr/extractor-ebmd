import { alihStatusPermohonanTable } from "@/drizzle/schema";
import { createInsertSchema, createSelectSchema } from "drizzle-zod";
import { z } from "zod";
import { AlihStatusDataContract } from "../data/contract";
import { AlihStatusSPKMBContract } from "../spkmb/contract";
import { AlihStatusType } from "@/enum/alihStatus";
import { AlihStatusBAPenelitianContract } from "../ba-penelitian/contract";
import { PerangkatDaerah } from "@/enum/perangkatDaerah";

export const AlihStatusPermohonanContract = {
    select: createSelectSchema(alihStatusPermohonanTable).extend({
        alihStatusType: z.enum(AlihStatusType),
    }),
    selectWithDetail: z.object({
        data: AlihStatusDataContract.select.array(),
        spkmb: AlihStatusSPKMBContract.select.array(),
        permohonan: createSelectSchema(alihStatusPermohonanTable).extend({
            alihStatusType: z.enum(AlihStatusType)
        }),
    }),

    create: createInsertSchema(alihStatusPermohonanTable).extend({
        alihStatusType: z.enum(AlihStatusType)
    })
        .omit({ createdAt: true, createdBy: true }),
    import: createInsertSchema(alihStatusPermohonanTable)
        .omit({ createdAt: true, createdBy: true })
        .array(),

    insert: createInsertSchema(alihStatusPermohonanTable).extend({
        alihStatusType: z.enum(AlihStatusType)
    }),

    edit: createInsertSchema(alihStatusPermohonanTable)
        .extend({ id: z.number().int().positive(), alihStatusType: z.enum(AlihStatusType) })
        .omit({ createdAt: true, createdBy: true }),
    update: createInsertSchema(alihStatusPermohonanTable)
        .extend({ id: z.number().int().positive(), createdBy: z.string(), updatedAt: z.date(), updatedBy: z.string(), alihStatusType: z.enum(AlihStatusType) })
        .omit({ createdAt: true, createdBy: true }),

    delete: z.object({ id: z.number().int().positive() }),
    remove: z.object({
        id: z.number().int().positive(),
        deletedAt: z.date().default(new Date()),
        deletedBy: z.string(),
    }),
};

export namespace AlihStatusPermohonanContract {
    export type SelectDTO = z.infer<typeof AlihStatusPermohonanContract.select>;
    export type SelectWithDetailDTO = z.infer<typeof AlihStatusPermohonanContract.selectWithDetail>;
    export type CreateDTO = z.infer<typeof AlihStatusPermohonanContract.create>;
    export type InsertDTO = z.infer<typeof AlihStatusPermohonanContract.insert>;
    export type EditDTO = z.infer<typeof AlihStatusPermohonanContract.edit>;
    export type UpdateDTO = z.infer<typeof AlihStatusPermohonanContract.update>;
    export type DeleteDTO = z.infer<typeof AlihStatusPermohonanContract.delete>;
    export type RemoveDTO = z.infer<typeof AlihStatusPermohonanContract.remove>;
}
