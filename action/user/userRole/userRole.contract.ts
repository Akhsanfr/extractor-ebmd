import { createSelectSchema } from "drizzle-zod";
import z from "zod";
import { UserRole } from "@/enum/user";
import { userRoleTable } from "@/drizzle/schema/userRole";

export const UserRoleContract = {
    select: createSelectSchema(userRoleTable),
    attachRole: z.object({
        userId: z.string(),
        role: z.enum(UserRole),
    }),
    detachRole: z.object({
        userId: z.string(),
        role: z.enum(UserRole),
    }),
    attachRoles: z.object({
        userId: z.string(),
        roles: z.array(z.enum(UserRole)).min(1),
    }),
};

export namespace UserRoleContract {
    export type Select = z.infer<typeof UserRoleContract.select>;
    export type AttachRole = z.infer<typeof UserRoleContract.attachRole>;
    export type DetachRole = z.infer<typeof UserRoleContract.detachRole>;
    export type AttachRoles = z.infer<typeof UserRoleContract.attachRoles>;
}