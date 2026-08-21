import { syncListTable } from "@/drizzle/schema";
import { SyncStatus } from "@/enum/sync";
import { createInsertSchema, createSelectSchema } from "drizzle-zod";
import { z } from "zod";

export const SyncListContract = {
    create: createInsertSchema(syncListTable).extend({
        status: z.enum(SyncStatus)
    }),

    edit: createInsertSchema(syncListTable).extend({
        status: z.enum(SyncStatus)
    }),

    delete: createSelectSchema(syncListTable).pick({
        id: true,
    }),

    select: createSelectSchema(syncListTable),

    selectWithProgress: createSelectSchema(syncListTable).extend({
        status: z.enum(SyncStatus),
        totalBatch: z.number().int().nonnegative(),
        completedBatch: z.number().int().nonnegative(),
        failedBatch: z.number().int().nonnegative(),
    }),
};

export namespace SyncListContract {
    export type CreateDTO = z.infer<typeof SyncListContract.create>;
    export type EditDTO = z.infer<typeof SyncListContract.edit>;
    export type DeleteDTO = z.infer<typeof SyncListContract.delete>;
    export type SelectDTO = z.infer<typeof SyncListContract.select>;
    export type SelectWithProgressDTO = z.infer<
        typeof SyncListContract.selectWithProgress
    >;
}
