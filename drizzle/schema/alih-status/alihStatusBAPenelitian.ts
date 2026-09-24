import { serial, text, date, integer, timestamp, index, snakeCase } from "drizzle-orm/pg-core";
import { alihStatusTypeEnum, userTable } from "./../../schema";

export const alihStatusBAPenelitianTable = snakeCase.table(
    "alih_status_ba_penelitian",
    {
        id: serial("id").primaryKey(),
        tahun: integer().notNull(),
        perangkatDaerahAsal: text(),
        penggunaBarangAsalNama: text(),
        pengurusBarangAsalNama: text(),
        suratNomor: text(),
        suratTanggal: date(),
        createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
        createdBy: text("created_by").references(() => userTable.id),
        updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
        updatedBy: text("updated_by").references(() => userTable.id),
        deletedAt: timestamp("deleted_at", { withTimezone: true }).defaultNow().notNull(),
        deletedBy: text("deleted_by").references(() => userTable.id),
    },
    (table) => [index().on(table.tahun)],
);
