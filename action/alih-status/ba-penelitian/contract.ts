import { alihStatusBAPenelitianTable } from "@/drizzle/schema";
import { createInsertSchema, createSelectSchema } from "drizzle-zod";
import { z } from "zod";
import { AlihStatusDataContract } from "../data/contract";
import { AlihStatusPermohonanContract } from "../permohonan/contract";
import { AlihStatusTrackingContract } from "../tracking/contract";

export const AlihStatusBAPenelitianContract = {
    select: createSelectSchema(alihStatusBAPenelitianTable),

    selectWithDetail: z.object({
        data: AlihStatusDataContract.select.array(),
        BAPenelitian: createSelectSchema(alihStatusBAPenelitianTable),
        permohonan: AlihStatusPermohonanContract.select.array(),
        tracking: AlihStatusTrackingContract.select.array()
    }),

    create: createInsertSchema(alihStatusBAPenelitianTable).extend({
        dataIds: z.number().array()
    })
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
    export type SelectWithDetailDTO = z.infer<typeof AlihStatusBAPenelitianContract.selectWithDetail>;
    export type CreateDTO = z.infer<typeof AlihStatusBAPenelitianContract.create>;
    export type InsertDTO = z.infer<typeof AlihStatusBAPenelitianContract.insert>;
    export type EditDTO = z.infer<typeof AlihStatusBAPenelitianContract.edit>;
    export type UpdateDTO = z.infer<typeof AlihStatusBAPenelitianContract.update>;
    export type DeleteDTO = z.infer<typeof AlihStatusBAPenelitianContract.delete>;
    export type RemoveDTO = z.infer<typeof AlihStatusBAPenelitianContract.remove>;
}
