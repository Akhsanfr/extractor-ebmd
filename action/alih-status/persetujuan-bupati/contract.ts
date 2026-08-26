import { alihStatusPersetujuanBupatiTable } from "@/drizzle/schema";
import { createInsertSchema, createSelectSchema } from "drizzle-zod";
import { z } from "zod";

export const AlihStatusPersetujuanBupatiContract = {
    select: createSelectSchema(alihStatusPersetujuanBupatiTable),

    create: createInsertSchema(alihStatusPersetujuanBupatiTable)
        .omit({ createdAt: true, createdBy: true }),
    import: createInsertSchema(alihStatusPersetujuanBupatiTable)
        .omit({ createdAt: true, createdBy: true })
        .array(),

    insert: createInsertSchema(alihStatusPersetujuanBupatiTable),

    edit: createInsertSchema(alihStatusPersetujuanBupatiTable)
        .extend({ id: z.number().int().positive() })
        .omit({ createdAt: true, createdBy: true }),
    update: createInsertSchema(alihStatusPersetujuanBupatiTable)
        .extend({ id: z.number().int().positive(), createdBy: z.string(), updatedAt: z.date(), updatedBy: z.string() })
        .omit({ createdAt: true, createdBy: true }),

    delete: z.object({ id: z.number().int().positive() }),
    remove: z.object({
        id: z.number().int().positive(),
        deletedAt: z.date().default(new Date()),
        deletedBy: z.string(),
    }),
};

export namespace AlihStatusPersetujuanBupatiContract {
    export type SelectDTO = z.infer<typeof AlihStatusPersetujuanBupatiContract.select>;
    export type CreateDTO = z.infer<typeof AlihStatusPersetujuanBupatiContract.create>;
    export type InsertDTO = z.infer<typeof AlihStatusPersetujuanBupatiContract.insert>;
    export type EditDTO = z.infer<typeof AlihStatusPersetujuanBupatiContract.edit>;
    export type UpdateDTO = z.infer<typeof AlihStatusPersetujuanBupatiContract.update>;
    export type DeleteDTO = z.infer<typeof AlihStatusPersetujuanBupatiContract.delete>;
    export type RemoveDTO = z.infer<typeof AlihStatusPersetujuanBupatiContract.remove>;
}
