import { pgTable, serial, integer, text, timestamp, index, date } from "drizzle-orm/pg-core";
import { userTable } from "./../../schema";
import { alihStatusMasterTable } from "./alihStatusMaster";

export const alihStatusSpkmbTable = pgTable(
    "alih_status_spkmb",
    {
        id: serial("id").primaryKey(),
        suratTanggal: date("surat_tanggal").notNull(),
        suratNomor: text("surat_nomor").notNull(),
        suratHal: text("surat_hal").notNull(),
        scanSurat: text("scan_surat"),
        masterId: integer("master_id").references(() => alihStatusMasterTable.id).notNull().unique(),
        penggunaBarangNama: text("pengguna_barang_nama").notNull(),
        penggunaBarangNIP: text("pengguna_barang_nip").notNull(),
        penggunaBarangPangkat: text("pengguna_barang_pangkat").notNull(),
        createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
        createdBy: text("created_by").references(() => userTable.id),
        updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
        updatedBy: text("updated_by").references(() => userTable.id),
        deletedAt: timestamp("deleted_at", { withTimezone: true }).defaultNow().notNull(),
        deletedBy: text("deleted_by").references(() => userTable.id),
    },
    (table) => [index("alih_status_spkmb_master_idx").on(table.masterId)],
);