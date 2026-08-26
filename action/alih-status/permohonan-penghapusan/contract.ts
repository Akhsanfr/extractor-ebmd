import { alihStatusPermohonanPenghapusanTable } from "@/drizzle/schema";
import { createInsertSchema, createSelectSchema } from "drizzle-zod";
import { z } from "zod";

export const AlihStatusPermohonanPenghapusanContract = {
    select: createSelectSchema(alihStatusPermohonanPenghapusanTable),

    create: createInsertSchema(alihStatusPermohonanPenghapusanTable)
        .omit({ createdAt: true, createdBy: true }),
    import: createInsertSchema(alihStatusPermohonanPenghapusanTable)
        .omit({ createdAt: true, createdBy: true })
        .array(),

    insert: createInsertSchema(alihStatusPermohonanPenghapusanTable),

    edit: createInsertSchema(alihStatusPermohonanPenghapusanTable)
        .extend({ id: z.number().int().positive() })
        .omit({ createdAt: true, createdBy: true }),
    update: createInsertSchema(alihStatusPermohonanPenghapusanTable)
        .extend({ id: z.number().int().positive(), createdBy: z.string(), updatedAt: z.date(), updatedBy: z.string() })
        .omit({ createdAt: true, createdBy: true }),

    delete: z.object({ id: z.number().int().positive() }),
    remove: z.object({
        id: z.number().int().positive(),
        deletedAt: z.date().default(new Date()),
        deletedBy: z.string(),
    }),
};

export namespace AlihStatusPermohonanPenghapusanContract {
    export type SelectDTO = z.infer<typeof AlihStatusPermohonanPenghapusanContract.select>;
    export type CreateDTO = z.infer<typeof AlihStatusPermohonanPenghapusanContract.create>;
    export type InsertDTO = z.infer<typeof AlihStatusPermohonanPenghapusanContract.insert>;
    export type EditDTO = z.infer<typeof AlihStatusPermohonanPenghapusanContract.edit>;
    export type UpdateDTO = z.infer<typeof AlihStatusPermohonanPenghapusanContract.update>;
    export type DeleteDTO = z.infer<typeof AlihStatusPermohonanPenghapusanContract.delete>;
    export type RemoveDTO = z.infer<typeof AlihStatusPermohonanPenghapusanContract.remove>;
}
