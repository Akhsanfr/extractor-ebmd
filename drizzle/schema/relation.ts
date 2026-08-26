import { defineRelations } from "drizzle-orm";
import * as schema from "./index";
export const relations = defineRelations(schema, (r) => ({
    userTable: {
        profile: r.one.userProfileTable({
            from: r.userTable.id,
            to: r.userProfileTable.userId,
        }),
        roles: r.many.userRoleTable(),
    },

    userRoleTable: {
        user: r.one.userTable({
            from: r.userRoleTable.userId,
            to: r.userTable.id,
        }),
    },

    userProfileTable: {
        user: r.one.userTable({
            from: r.userProfileTable.userId,
            to: r.userTable.id
        }),

    },
}));