import { syncJobTable } from "@/drizzle/schema";
import { SyncStatus } from "@/enum/sync";
import { createInsertSchema, createSelectSchema } from "drizzle-zod";
import { z } from "zod";
import { SyncEbmdContract } from "../provider/ebmd.contrac";


export const SyncJobContract = {
    create: z.discriminatedUnion("jobType", [
        SyncEbmdContract.create
    ]),

    cancel: z.object({
        id: z.number().int().positive(),
        abortReason: z.string().min(3).max(500),
    }),

    select: createSelectSchema(syncJobTable),
    selectWithProgress: createSelectSchema(syncJobTable).extend({
        status: z.enum(SyncStatus),
        totalList: z.number().int().nonnegative(),
        totalBatch: z.number().int().nonnegative(),
        completedBatch: z.number().int().nonnegative(),
        failedBatch: z.number().int().nonnegative(),
    })

};

export namespace SyncJobContract {
    export type CreateDTO = z.infer<typeof SyncJobContract.create>;
    export type CancelDTO = z.infer<typeof SyncJobContract.cancel>;
    export type SelectDTO = z.infer<typeof SyncJobContract.select>;
    export type SelectWithProgressDTO = z.infer<
        typeof SyncJobContract.selectWithProgress
    >;
}
