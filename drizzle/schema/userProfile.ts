import { pgTable, serial, text, timestamp, varchar } from "drizzle-orm/pg-core";
import { userTable } from "./auth";
import { perangkatDaerahTable } from "./perangkatDaerah";
import { relations } from "drizzle-orm";

export const userProfileTable = pgTable("user_profile", {
    id: serial("id").primaryKey(),

    userId: text("user_id")
        .notNull()
        .unique() // one-to-one
        .references(() => userTable.id, { onDelete: "cascade" }),

    nama: text("nama").notNull(),
    nip: varchar("nip", { length: 20 }).unique(),
    hp: varchar("hp", { length: 15 }),

    perangkatDaerahKodeLokasi: varchar("perangkat_daerah_kode_lokasi", { length: 20 })
        .references(() => perangkatDaerahTable.kodeLokasi, { onDelete: "set null" }),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true }),
    deletedAt: timestamp("deleted_at", { withTimezone: true }),
    createdBy: text("created_by").references(() => userTable.id, { onDelete: "restrict" }).notNull(),
    updatedBy: text("updated_by").references(() => userTable.id, { onDelete: "restrict" }),
    deletedBy: text("deleted_by").references(() => userTable.id, { onDelete: "restrict" }),
});

export const userProfileRelations = relations(userProfileTable, ({ one }) => ({
    user: one(userTable, {
        fields: [userProfileTable.userId],
        references: [userTable.id],
    }),
    perangkatDaerah: one(perangkatDaerahTable, {
        fields: [userProfileTable.perangkatDaerahKodeLokasi],
        references: [perangkatDaerahTable.kodeLokasi],
    }),
}));

export type SelectUserProfile = typeof userProfileTable.$inferSelect;
export type InsertUserProfile = typeof userProfileTable.$inferInsert;
