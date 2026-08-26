import { pgTable, serial, text, timestamp, varchar } from "drizzle-orm/pg-core";
import { userTable } from "../auth";

export const userProfileTable = pgTable("user_profile", {
    id: serial("id").primaryKey(),

    userId: text("user_id")
        .unique() // one-to-one
        .references(() => userTable.id, { onDelete: "cascade" }),

    nama: text("nama").notNull(),
    nip: varchar("nip", { length: 20 }).unique(),
    wa: varchar("wa", { length: 15 }),

    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true }),
    deletedAt: timestamp("deleted_at", { withTimezone: true }),
    createdBy: text("created_by").references(() => userTable.id, { onDelete: "restrict" }).notNull(),
    updatedBy: text("updated_by").references(() => userTable.id, { onDelete: "restrict" }),
    deletedBy: text("deleted_by").references(() => userTable.id, { onDelete: "restrict" }),
});
