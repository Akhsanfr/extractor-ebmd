import { PerangkatDaerahContract } from "@/action/perangkatDaerah/perangkatDaerah.contract";
import { userProfileTable } from "@/drizzle/schema/userProfile";
import { createInsertSchema, createSelectSchema } from "drizzle-zod";

import z from "zod";

export const UserProfileContract = {
    select: createSelectSchema(userProfileTable),
    selectWithPerangkatDaerah: createSelectSchema(userProfileTable).extend({
        perangkatDaerah: PerangkatDaerahContract.select.nullable()
    }),
    insert: createInsertSchema(userProfileTable),
    update: createInsertSchema(userProfileTable)
}
export namespace UserProfileContract {
    export type SelectDTO = z.infer<typeof UserProfileContract.select>
    export type SelectWithPerangkatDaerahDTO = z.infer<typeof UserProfileContract.selectWithPerangkatDaerah>
    export type InsertDTO = z.infer<typeof UserProfileContract.insert>
    export type UpdateDTO = z.infer<typeof UserProfileContract.update>
}