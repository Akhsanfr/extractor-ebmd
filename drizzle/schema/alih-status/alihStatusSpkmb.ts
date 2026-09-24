import { serial, integer, text, timestamp, index, date, snakeCase, boolean } from "drizzle-orm/pg-core";
import { userTable } from "./../../schema";

export const alihStatusSpkmbTable = snakeCase.table(
    "alih_status_spkmb",
    {
        id: serial("id").primaryKey(),
        tahun: integer(),
        isComplete: boolean().notNull(),
        suratTanggal: date("surat_tanggal"),
        suratNomor: text("surat_nomor").notNull(),
        scanSurat: text("scan_surat"),
        perangkatDaerahTujuan: text().notNull(),
        penggunaBarangTujuanNama: text().notNull(),
        penggunaBarangTujuanNIP: text().notNull(),
        penggunaBarangTujuanPangkat: text().notNull(),
        penggunaBarangTujuanJabatan: text(),
        createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
        createdBy: text("created_by").references(() => userTable.id),
        updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
        updatedBy: text("updated_by").references(() => userTable.id),
    },
    (table) => [index().on(table.tahun)],
);