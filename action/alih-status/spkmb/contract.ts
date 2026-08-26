import { alihStatusSpkmbTable } from "@/drizzle/schema";
import { createInsertSchema, createSelectSchema } from "drizzle-zod";
import { z } from "zod";

export const AlihStatusSpkmbContract = {
    select: createSelectSchema(alihStatusSpkmbTable),

    create: createInsertSchema(alihStatusSpkmbTable)
        .omit({ createdAt: true, createdBy: true }),
    import: createInsertSchema(alihStatusSpkmbTable)
        .omit({ createdAt: true, createdBy: true })
        .array(),

    insert: createInsertSchema(alihStatusSpkmbTable),

    edit: createInsertSchema(alihStatusSpkmbTable)
        .extend({ id: z.number().int().positive() })
        .omit({ createdAt: true, createdBy: true }),
    update: createInsertSchema(alihStatusSpkmbTable)
        .extend({ id: z.number().int().positive(), createdBy: z.string(), updatedAt: z.date(), updatedBy: z.string() })
        .omit({ createdAt: true, createdBy: true }),

    delete: z.object({ id: z.number().int().positive() }),
    remove: z.object({
        id: z.number().int().positive(),
        deletedAt: z.date().default(new Date()),
        deletedBy: z.string(),
    }),
};

export namespace AlihStatusSpkmbContract {
    export type SelectDTO = z.infer<typeof AlihStatusSpkmbContract.select>;
    export type CreateDTO = z.infer<typeof AlihStatusSpkmbContract.create>;
    export type InsertDTO = z.infer<typeof AlihStatusSpkmbContract.insert>;
    export type EditDTO = z.infer<typeof AlihStatusSpkmbContract.edit>;
    export type UpdateDTO = z.infer<typeof AlihStatusSpkmbContract.update>;
    export type DeleteDTO = z.infer<typeof AlihStatusSpkmbContract.delete>;
    export type RemoveDTO = z.infer<typeof AlihStatusSpkmbContract.remove>;
}
