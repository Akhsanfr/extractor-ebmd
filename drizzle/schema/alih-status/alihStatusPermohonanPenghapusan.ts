import { serial, text, date, integer, timestamp, index, snakeCase } from "drizzle-orm/pg-core";
import {  userTable } from "./../../schema";

export const alihStatusPermohonanPenghapusanTable = snakeCase.table(
    "alih_status_permohonan_penghapusan",
    {
        id: serial("id").primaryKey(),
        tahun: integer(),
        perangkatDaerahAsal: text().notNull(),
        penggunaBarangAsalNama: text(),
        penggunaBarangAsalNIP: text(),
        penggunaBarangAsalJabatan: text(),
        penggunaBarangAsalPangkat: text(),
        suratNomor: text("surat_nomor"),
        suratTanggal: date("surat_tanggal"),
        suratHal: text("surat_hal"),
        createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
        createdBy: text("created_by").references(() => userTable.id),
        updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
        updatedBy: text("updated_by").references(() => userTable.id),
    },
    (table) => [index().on(table.tahun)],
);
