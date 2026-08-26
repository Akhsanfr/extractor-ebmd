import { userRoleTable, userTable } from "@/drizzle/schema";
import { createSelectSchema } from "drizzle-zod";
import z from "zod";
import { UserRole } from "@/enum/user";
import { UserProfileContract } from "../userProfile/user-profile.contract";
import { UserRoleContract } from "../userRole/userRole.contract";

export const UserContract = {
    select: createSelectSchema(userTable),
    selectWithProfile: createSelectSchema(userTable).extend({
        profile: UserProfileContract.select.nullable()
    }),
    selectWithRole: createSelectSchema(userTable).extend({
        roles: z.array(z.enum(UserRole))
    }),
    selectWithDetail: createSelectSchema(userTable).extend({
        profile: UserProfileContract.select.nullable(),
        roles: z.array(z.enum(UserRole)),
    })
}

export namespace UserContract {
    export type SelectDTO = z.infer<typeof UserContract.select>
    export type SelectWithProfile = z.infer<typeof UserContract.selectWithProfile>
    export type SelectWithRole = z.infer<typeof UserContract.selectWithRole>
    export type SelectWithDetail = z.infer<typeof UserContract.selectWithDetail>
}