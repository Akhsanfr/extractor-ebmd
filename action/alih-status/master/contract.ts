import { alihStatusMasterTable } from "@/drizzle/schema";
import { createInsertSchema, createSelectSchema } from "drizzle-zod";
import { z } from "zod";

export const AlihStatusMasterContract = {
    select: createSelectSchema(alihStatusMasterTable),
    selectWithSumData: createSelectSchema(alihStatusMasterTable).extend({
        totalNilaiPerolehan: z.number(),
        jumlahBarang: z.number()
    }),

    create: createInsertSchema(alihStatusMasterTable)
        .omit({ createdAt: true, createdBy: true }),
    import: createInsertSchema(alihStatusMasterTable)
        .omit({ createdAt: true, createdBy: true })
        .array(),

    insert: createInsertSchema(alihStatusMasterTable),

    edit: createInsertSchema(alihStatusMasterTable)
        .extend({ id: z.number().int().positive() })
        .omit({ createdAt: true, createdBy: true }),
    update: createInsertSchema(alihStatusMasterTable)
        .extend({ id: z.number().int().positive(), createdBy: z.string(), updatedAt: z.date(), updatedBy: z.string() })
        .omit({ createdAt: true, createdBy: true }),


    delete: z.object({ id: z.number().int().positive() }),
    remove: z.object({
        id: z.number().int().positive(),
        deletedAt: z.date().default(new Date()),
        deletedBy: z.string(),
    }),

};

export namespace AlihStatusMasterContract {
    export type SelectDTO = z.infer<typeof AlihStatusMasterContract.select>;
    export type SelectWithSumDataDTO = z.infer<typeof AlihStatusMasterContract.selectWithSumData>;
    export type CreateDTO = z.infer<typeof AlihStatusMasterContract.create>;
    export type InsertDTO = z.infer<typeof AlihStatusMasterContract.insert>;
    export type EditDTO = z.infer<typeof AlihStatusMasterContract.edit>;
    export type UpdateDTO = z.infer<typeof AlihStatusMasterContract.update>;
    export type DeleteDTO = z.infer<typeof AlihStatusMasterContract.delete>;
    export type RemoveDTO = z.infer<typeof AlihStatusMasterContract.remove>;
}