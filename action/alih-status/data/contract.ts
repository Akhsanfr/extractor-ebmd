import { alihStatusDataTable } from "@/drizzle/schema";
import { createInsertSchema, createSelectSchema } from "drizzle-zod";
import { z } from "zod";
z.config(z.locales.id());


const baseSelect = createSelectSchema(alihStatusDataTable).omit({ createdAt: true, createdBy: true, updatedAt: true, updatedBy: true, deletedAt: true, deletedBy: true })

export const AlihStatusDataContract = {
    select: baseSelect.extend({
        perangkatDaerahAsal: z.string()
    }),

    create: createInsertSchema(alihStatusDataTable)
        .omit({ createdAt: true, createdBy: true }),

    insert: createInsertSchema(alihStatusDataTable),
    importItem: baseSelect
        .omit({ masterId: true, id: true }).array(),

    importData: z.object({
        data: z.instanceof(File),
        masterId: z.number(),
    }),


    edit: createInsertSchema(alihStatusDataTable)
        .extend({ id: z.number().int().positive() })
        .omit({ createdAt: true, createdBy: true }),
    update: createInsertSchema(alihStatusDataTable)
        .extend({ id: z.number().int().positive(), createdBy: z.string(), updatedAt: z.date(), updatedBy: z.string() })
        .omit({ createdAt: true, createdBy: true }),

    delete: z.object({ id: z.number().int().positive() }),
    remove: z.object({
        id: z.number().int().positive(),
        deletedAt: z.date().default(new Date()),
        deletedBy: z.string(),
    }),
};

export namespace AlihStatusDataContract {
    export type SelectDTO = z.infer<typeof AlihStatusDataContract.select>;
    export type CreateDTO = z.infer<typeof AlihStatusDataContract.create>;
    export type InsertDTO = z.infer<typeof AlihStatusDataContract.insert>;
    export type ImportItemDTO = z.infer<typeof AlihStatusDataContract.importItem>;
    export type ImportDataDTO = z.infer<typeof AlihStatusDataContract.importData>;
    export type EditDTO = z.infer<typeof AlihStatusDataContract.edit>;
    export type UpdateDTO = z.infer<typeof AlihStatusDataContract.update>;
    export type DeleteDTO = z.infer<typeof AlihStatusDataContract.delete>;
    export type RemoveDTO = z.infer<typeof AlihStatusDataContract.remove>;
}
