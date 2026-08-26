import { pgTable, serial, text } from "drizzle-orm/pg-core";
import { userTable } from "./auth";
import { userRoleEnum } from "./enum";

export const userRoleTable = pgTable("user_role", {
    id: serial("id").primaryKey(),
    userId: text("user_id")
        .notNull()
        .references(() => userTable.id, { onDelete: "cascade" }),
    role: userRoleEnum("role").notNull(),
});
