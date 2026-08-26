import { pgTable, serial, text, integer, timestamp, index } from "drizzle-orm/pg-core";
import { alihStatusMasterTable, userTable } from "..";

export const alihStatusBASTTable = pgTable(
    "alih_status_bast",
    {
        id: serial("id").primaryKey(),
        masterId: integer().references(() => alihStatusMasterTable.id).notNull(),
        perangkatDaerahAsal: text("perangkat_daerah_asal"),
        perangkatDaerahTujuan: text("perangkat_daerah_tujuan"),
        createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
        createdBy: text("created_by").references(() => userTable.id),
        updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
        updatedBy: text("updated_by").references(() => userTable.id),
        deletedAt: timestamp("deleted_at", { withTimezone: true }).defaultNow().notNull(),
        deletedBy: text("deleted_by").references(() => userTable.id),
    },
    (table) => [index().on(table.masterId)],
);
