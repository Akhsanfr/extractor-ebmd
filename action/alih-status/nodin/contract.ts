import { alihStatusNodinTable } from "@/drizzle/schema";
import { createInsertSchema, createSelectSchema } from "drizzle-zod";
import { z } from "zod";

export const AlihStatusNodinContract = {
    select: createSelectSchema(alihStatusNodinTable),

    create: createInsertSchema(alihStatusNodinTable)
        .omit({ createdAt: true, createdBy: true }),
    import: createInsertSchema(alihStatusNodinTable)
        .omit({ createdAt: true, createdBy: true })
        .array(),

    insert: createInsertSchema(alihStatusNodinTable),

    edit: createInsertSchema(alihStatusNodinTable)
        .extend({ id: z.number().int().positive() })
        .omit({ createdAt: true, createdBy: true }),
    update: createInsertSchema(alihStatusNodinTable)
        .extend({ id: z.number().int().positive(), createdBy: z.string(), updatedAt: z.date(), updatedBy: z.string() })
        .omit({ createdAt: true, createdBy: true }),

    delete: z.object({ id: z.number().int().positive() }),
    remove: z.object({
        id: z.number().int().positive(),
        deletedAt: z.date().default(new Date()),
        deletedBy: z.string(),
    }),
};

export namespace AlihStatusNodinContract {
    export type SelectDTO = z.infer<typeof AlihStatusNodinContract.select>;
    export type CreateDTO = z.infer<typeof AlihStatusNodinContract.create>;
    export type InsertDTO = z.infer<typeof AlihStatusNodinContract.insert>;
    export type EditDTO = z.infer<typeof AlihStatusNodinContract.edit>;
    export type UpdateDTO = z.infer<typeof AlihStatusNodinContract.update>;
    export type DeleteDTO = z.infer<typeof AlihStatusNodinContract.delete>;
    export type RemoveDTO = z.infer<typeof AlihStatusNodinContract.remove>;
}
