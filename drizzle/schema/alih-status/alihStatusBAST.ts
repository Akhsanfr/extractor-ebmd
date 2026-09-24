import { serial, text, integer, timestamp, index, uniqueIndex, date, snakeCase } from "drizzle-orm/pg-core";
import { userTable } from "./../../schema"

export const alihStatusBASTTable = snakeCase.table(
    "alih_status_bast",
    {
        id: serial("id").primaryKey(),
        suratNomor: text(),
        suratTanggal: date(),
        tahun: integer(),
        perangkatDaerahAsal: text().notNull(),
        perangkatDaerahTujuan: text().notNull(),
        penggunaBarangAsalNama: text(),
        penggunaBarangAsalNIP: text(),
        penggunaBarangAsalJabatan: text(),
        penggunaBarangAsalPangkat: text(),
        penggunaBarangTujuanNama: text(),
        penggunaBarangTujuanNIP: text(),
        penggunaBarangTujuanJabatan: text(),
        penggunaBarangTujuanPangkat: text(),
        createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
        createdBy: text("created_by").references(() => userTable.id),
        updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
        updatedBy: text("updated_by").references(() => userTable.id),
    },
    (table) => [index().on(table.tahun)],
);
