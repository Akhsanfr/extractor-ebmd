import { syncBatchTable } from "@/drizzle/schema";
import { SyncStatus } from "@/enum/sync";
import { createSelectSchema } from "drizzle-zod";
import { z } from "zod";

export const SyncBatchContract = {
    // Dipakai internal oleh syncList.service saat generate batch.
    create: z.object({
        listId: z.number().int().positive(),
        batchSize: z.number().int().positive(),
        batchPage: z.number().int().positive(),
    }),

    retry: z.object({
        id: z.number().int().positive(),
    }),

    delete: z.object({
        id: z.number().int().positive(),
    }),

    select: createSelectSchema(syncBatchTable).extend({
        status: z.enum(SyncStatus)
    }),
};

export namespace SyncBatchContract {
    export type CreateDTO = z.infer<typeof SyncBatchContract.create>;
    export type RetryDTO = z.infer<typeof SyncBatchContract.retry>;
    export type DeleteDTO = z.infer<typeof SyncBatchContract.delete>;
    export type SelectDTO = z.infer<typeof SyncBatchContract.select>;
}
