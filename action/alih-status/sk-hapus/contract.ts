import { alihStatusSKHapusTable } from "@/drizzle/schema";
import { createInsertSchema, createSelectSchema } from "drizzle-zod";
import { z } from "zod";

export const AlihStatusSKHapusContract = {
    select: createSelectSchema(alihStatusSKHapusTable),

    create: createInsertSchema(alihStatusSKHapusTable)
        .omit({ createdAt: true, createdBy: true }),
    import: createInsertSchema(alihStatusSKHapusTable)
        .omit({ createdAt: true, createdBy: true })
        .array(),

    insert: createInsertSchema(alihStatusSKHapusTable),

    edit: createInsertSchema(alihStatusSKHapusTable)
        .extend({ id: z.number().int().positive() })
        .omit({ createdAt: true, createdBy: true }),
    update: createInsertSchema(alihStatusSKHapusTable)
        .extend({ id: z.number().int().positive(), createdBy: z.string(), updatedAt: z.date(), updatedBy: z.string() })
        .omit({ createdAt: true, createdBy: true }),

    delete: z.object({ id: z.number().int().positive() }),
    remove: z.object({
        id: z.number().int().positive(),
        deletedAt: z.date().default(new Date()),
        deletedBy: z.string(),
    }),
};

export namespace AlihStatusSKHapusContract {
    export type SelectDTO = z.infer<typeof AlihStatusSKHapusContract.select>;
    export type CreateDTO = z.infer<typeof AlihStatusSKHapusContract.create>;
    export type InsertDTO = z.infer<typeof AlihStatusSKHapusContract.insert>;
    export type EditDTO = z.infer<typeof AlihStatusSKHapusContract.edit>;
    export type UpdateDTO = z.infer<typeof AlihStatusSKHapusContract.update>;
    export type DeleteDTO = z.infer<typeof AlihStatusSKHapusContract.delete>;
    export type RemoveDTO = z.infer<typeof AlihStatusSKHapusContract.remove>;
}
