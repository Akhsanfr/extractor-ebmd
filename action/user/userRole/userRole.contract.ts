import { createSelectSchema } from "drizzle-zod";
import z from "zod";
import { UserRole } from "@/enum/user";
import { userRoleTable } from "@/drizzle/schema";

export const UserRoleContract = {
    select: createSelectSchema(userRoleTable),
    syncRoles: z.object({
        userId: z.string(),
        roles: z.array(z.enum(UserRole)).default([])
    }),
};

export namespace UserRoleContract {
    export type Select = z.infer<typeof UserRoleContract.select>;
    export type SyncRoles = z.infer<typeof UserRoleContract.syncRoles>;
}