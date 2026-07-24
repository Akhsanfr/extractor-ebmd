import { userRoleTable, userTable } from "@/drizzle/schema";
import { createSelectSchema } from "drizzle-zod";
import z from "zod";
import { UserProfileContract } from "../userProfile/userProfile.contract";

export const UserContract = {
    select: createSelectSchema(userTable),
    selectWithProfile: createSelectSchema(userTable).extend({
        profile: UserProfileContract.selectWithPerangkatDaerah.nullable()
    }),
    selectWithRole: createSelectSchema(userTable).extend({
        roles: userRoleTable
    }),
    selectWithDetail: createSelectSchema(userTable).extend({
        profile: UserProfileContract.selectWithPerangkatDaerah.nullable(),
        roles: userRoleTable
    })
}

export namespace UserContract {
    export type Select = z.infer<typeof UserContract.select>
    export type SelectWithProfile = z.infer<typeof UserContract.selectWithProfile>
    export type SelectWithRole = z.infer<typeof UserContract.selectWithRole>
    export type SelectWithDetail = z.infer<typeof UserContract.selectWithDetail>
}