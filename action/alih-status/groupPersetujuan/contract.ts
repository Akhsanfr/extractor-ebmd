import { alihStatusGroupPersetujuanTable } from "@/drizzle/schema";
import { createInsertSchema, createSelectSchema } from "drizzle-zod";
import { z } from "zod";

export const AlihStatusGroupPersetujuanContract = {
    select: createSelectSchema(alihStatusGroupPersetujuanTable),

    create: createInsertSchema(alihStatusGroupPersetujuanTable)
        .omit({ createdAt: true, createdBy: true }),
    import: createInsertSchema(alihStatusGroupPersetujuanTable)
        .omit({ createdAt: true, createdBy: true })
        .array(),

    insert: createInsertSchema(alihStatusGroupPersetujuanTable),

    edit: createInsertSchema(alihStatusGroupPersetujuanTable)
        .extend({ id: z.number().int().positive() })
        .omit({ createdAt: true, createdBy: true }),
    update: createInsertSchema(alihStatusGroupPersetujuanTable)
        .extend({ id: z.number().int().positive(), createdBy: z.string(), updatedAt: z.date(), updatedBy: z.string() })
        .omit({ createdAt: true, createdBy: true }),

    delete: z.object({ id: z.number().int().positive() }),
    remove: z.object({
        id: z.number().int().positive(),
        deletedAt: z.date().default(new Date()),
        deletedBy: z.string(),
    }),
};

export namespace AlihStatusGroupPersetujuanContract {
    export type SelectDTO = z.infer<typeof AlihStatusGroupPersetujuanContract.select>;
    export type CreateDTO = z.infer<typeof AlihStatusGroupPersetujuanContract.create>;
    export type InsertDTO = z.infer<typeof AlihStatusGroupPersetujuanContract.insert>;
    export type EditDTO = z.infer<typeof AlihStatusGroupPersetujuanContract.edit>;
    export type UpdateDTO = z.infer<typeof AlihStatusGroupPersetujuanContract.update>;
    export type DeleteDTO = z.infer<typeof AlihStatusGroupPersetujuanContract.delete>;
    export type RemoveDTO = z.infer<typeof AlihStatusGroupPersetujuanContract.remove>;
}
