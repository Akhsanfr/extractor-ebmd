import { alihStatusBASTTable } from "@/drizzle/schema";
import { createInsertSchema, createSelectSchema } from "drizzle-zod";
import { z } from "zod";

export const AlihStatusBASTContract = {
    select: createSelectSchema(alihStatusBASTTable),

    create: createInsertSchema(alihStatusBASTTable)
        .omit({ createdAt: true, createdBy: true }),
    import: createInsertSchema(alihStatusBASTTable)
        .omit({ createdAt: true, createdBy: true })
        .array(),

    insert: createInsertSchema(alihStatusBASTTable),

    edit: createInsertSchema(alihStatusBASTTable)
        .extend({ id: z.number().int().positive() })
        .omit({ createdAt: true, createdBy: true }),
    update: createInsertSchema(alihStatusBASTTable)
        .extend({ id: z.number().int().positive(), createdBy: z.string(), updatedAt: z.date(), updatedBy: z.string() })
        .omit({ createdAt: true, createdBy: true }),

    delete: z.object({ id: z.number().int().positive() }),
    remove: z.object({
        id: z.number().int().positive(),
        deletedAt: z.date().default(new Date()),
        deletedBy: z.string(),
    }),
};

export namespace AlihStatusBASTContract {
    export type SelectDTO = z.infer<typeof AlihStatusBASTContract.select>;
    export type CreateDTO = z.infer<typeof AlihStatusBASTContract.create>;
    export type InsertDTO = z.infer<typeof AlihStatusBASTContract.insert>;
    export type EditDTO = z.infer<typeof AlihStatusBASTContract.edit>;
    export type UpdateDTO = z.infer<typeof AlihStatusBASTContract.update>;
    export type DeleteDTO = z.infer<typeof AlihStatusBASTContract.delete>;
    export type RemoveDTO = z.infer<typeof AlihStatusBASTContract.remove>;
}
