import { pgTable, serial, text, uniqueIndex } from "drizzle-orm/pg-core";
import { userRoleEnum } from "../enum";
import { userTable } from "../auth";

export const userRoleTable = pgTable("user_role", {
    id: serial("id").primaryKey(),
    userId: text("user_id")
        .notNull()
        .references(() => userTable.id, { onDelete: "cascade" }),
    role: userRoleEnum("role").notNull(),
}, (table) => [
    uniqueIndex("user_role_user_id_role_idx").on(
        table.userId,
        table.role,
    ),
],);