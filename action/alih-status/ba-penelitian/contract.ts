import { alihStatusBAPenelitianTable } from "@/drizzle/schema";
import { createInsertSchema, createSelectSchema } from "drizzle-zod";
import { z } from "zod";

export const AlihStatusBAPenelitianContract = {
    select: createSelectSchema(alihStatusBAPenelitianTable),

    create: createInsertSchema(alihStatusBAPenelitianTable)
        .omit({ createdAt: true, createdBy: true }),
    import: createInsertSchema(alihStatusBAPenelitianTable)
        .omit({ createdAt: true, createdBy: true })
        .array(),

    insert: createInsertSchema(alihStatusBAPenelitianTable),

    edit: createInsertSchema(alihStatusBAPenelitianTable)
        .extend({ id: z.number().int().positive() })
        .omit({ createdAt: true, createdBy: true }),
    update: createInsertSchema(alihStatusBAPenelitianTable)
        .extend({ id: z.number().int().positive(), createdBy: z.string(), updatedAt: z.date(), updatedBy: z.string() })
        .omit({ createdAt: true, createdBy: true }),

    delete: z.object({ id: z.number().int().positive() }),
    remove: z.object({
        id: z.number().int().positive(),
        deletedAt: z.date().default(new Date()),
        deletedBy: z.string(),
    }),
};

export namespace AlihStatusBAPenelitianContract {
    export type SelectDTO = z.infer<typeof AlihStatusBAPenelitianContract.select>;
    export type CreateDTO = z.infer<typeof AlihStatusBAPenelitianContract.create>;
    export type InsertDTO = z.infer<typeof AlihStatusBAPenelitianContract.insert>;
    export type EditDTO = z.infer<typeof AlihStatusBAPenelitianContract.edit>;
    export type UpdateDTO = z.infer<typeof AlihStatusBAPenelitianContract.update>;
    export type DeleteDTO = z.infer<typeof AlihStatusBAPenelitianContract.delete>;
    export type RemoveDTO = z.infer<typeof AlihStatusBAPenelitianContract.remove>;
}
