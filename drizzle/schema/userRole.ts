import { pgTable, serial, text } from "drizzle-orm/pg-core";
import { userTable } from "./auth";
import { userRoleEnum } from "./enum";
import { relations } from "drizzle-orm";

export const userRoleTable = pgTable("user_role", {
    id: serial("id").primaryKey(),
    userId: text("user_id")
        .notNull()
        .references(() => userTable.id, { onDelete: "cascade" }),
    role: userRoleEnum("role").notNull(),
});

export const userRoleRelations = relations(userRoleTable, ({ one }) => ({
    user: one(userTable, {
        fields: [userRoleTable.userId],
        references: [userTable.id],
    }),
}));