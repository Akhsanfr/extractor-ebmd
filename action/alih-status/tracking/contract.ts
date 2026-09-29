import { alihStatusTrackingTable } from "@/drizzle/schema";
import { AlihStatusTrackingSourceType } from "@/enum/alihStatus";
import { createInsertSchema, createSelectSchema } from "drizzle-zod";
import { z } from "zod";

export const AlihStatusTrackingContract = {
    query: z.object({
        sourceType: z.enum(AlihStatusTrackingSourceType),
        sourceId: z.number(),
    }),

    create: createInsertSchema(alihStatusTrackingTable).extend({
        sourceType: z.enum(AlihStatusTrackingSourceType),
    }).omit({
        createdAt: true,
        updatedAt: true
    }),
    insert: createInsertSchema(alihStatusTrackingTable).extend({
        sourceType: z.enum(AlihStatusTrackingSourceType),
    }),

    // sourceType & sourceId sengaja tidak bisa diubah saat edit
    edit: createInsertSchema(alihStatusTrackingTable).extend({
        id: z.number(),
        sourceType: z.enum(AlihStatusTrackingSourceType),
    }).omit({
        createdAt: true,
        updatedAt: true
    }),
    update: createInsertSchema(alihStatusTrackingTable).extend({
        id: z.number(),
        sourceType: z.enum(AlihStatusTrackingSourceType),
    }),

    select: createSelectSchema(alihStatusTrackingTable).extend({
        sourceType: z.enum(AlihStatusTrackingSourceType)
    }),
};

export namespace AlihStatusTrackingContract {
    export type QueryDTO = z.infer<typeof AlihStatusTrackingContract.query>;
    export type CreateDTO = z.infer<typeof AlihStatusTrackingContract.create>;
    export type EditDTO = z.infer<typeof AlihStatusTrackingContract.edit>;
    export type SelectDTO = z.infer<typeof AlihStatusTrackingContract.select>;
    export type InsertDTO = z.infer<typeof AlihStatusTrackingContract.insert>;
    export type UpdateDTO = z.infer<typeof AlihStatusTrackingContract.update>;
}