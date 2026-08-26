import { alihStatusPermohonanTable } from "@/drizzle/schema";
import { createInsertSchema, createSelectSchema } from "drizzle-zod";
import { z } from "zod";

export const AlihStatusPermohonanContract = {
    select: createSelectSchema(alihStatusPermohonanTable),

    create: createInsertSchema(alihStatusPermohonanTable)
        .omit({ createdAt: true, createdBy: true }),
    import: createInsertSchema(alihStatusPermohonanTable)
        .omit({ createdAt: true, createdBy: true })
        .array(),

    insert: createInsertSchema(alihStatusPermohonanTable),

    edit: createInsertSchema(alihStatusPermohonanTable)
        .extend({ id: z.number().int().positive() })
        .omit({ createdAt: true, createdBy: true }),
    update: createInsertSchema(alihStatusPermohonanTable)
        .extend({ id: z.number().int().positive(), createdBy: z.string(), updatedAt: z.date(), updatedBy: z.string() })
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
    export type CreateDTO = z.infer<typeof AlihStatusPermohonanContract.create>;
    export type InsertDTO = z.infer<typeof AlihStatusPermohonanContract.insert>;
    export type EditDTO = z.infer<typeof AlihStatusPermohonanContract.edit>;
    export type UpdateDTO = z.infer<typeof AlihStatusPermohonanContract.update>;
    export type DeleteDTO = z.infer<typeof AlihStatusPermohonanContract.delete>;
    export type RemoveDTO = z.infer<typeof AlihStatusPermohonanContract.remove>;
}
