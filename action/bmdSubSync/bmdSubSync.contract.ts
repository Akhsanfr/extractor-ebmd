import { z } from "zod";
import { createSelectSchema } from "drizzle-zod";
import { bmdSubSyncTable } from "@/drizzle/schema/bmdSubSync";
import { bmdSubSyncStatusEnum } from "@/drizzle/schema/enum";

const selectSchema = createSelectSchema(bmdSubSyncTable).extend({
    status: z.enum(bmdSubSyncStatusEnum.enumValues),
});

const stopSchema = z.object({
    id: z.number().int().positive(),
});

export const BmdSubSyncContract = {
    select: selectSchema,
    stop: stopSchema,
};

export namespace BmdSubSyncContract {
    export type SelectDTO = z.infer<typeof BmdSubSyncContract.select>;
    export type StopDTO = z.infer<typeof BmdSubSyncContract.stop>;
}