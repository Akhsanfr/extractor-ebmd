import {
    pgTable,
    serial,
    varchar,
    integer,
    text,
    numeric,
    timestamp,
    index,
    snakeCase,
} from "drizzle-orm/pg-core";
import { alihStatusMasterTable, userTable } from "./../../schema";

export const alihStatusDataTable = snakeCase.table(
    "alih_status_data",
    {
        id: serial("id").primaryKey(),

        kodeBarang: text("kode_barang").notNull(),
        nibar: text(),
        kodeRegister: text("kode_register"),
        namaBarangKategori: text("nama_barang_kategori"),

        merkTipe: text("merk_tipe"),

        nomorPolisi: text("nomor_polisi"),
        nomorRangka: text("nomor_rangka"),
        nomorMesin: text("nomor_mesin"),

        kondisi: text("kondisi"),
        lokasi: text("lokasi"),

        asalUsul: text("asal_usul"),
        tahun: integer("tahun"),

        jumlah: numeric("jumlah", { precision: 20, scale: 2 }),

        nilaiPerolehan: numeric("nilai_perolehan", { precision: 20, scale: 2 }),
        akumulasiPenyusutan: numeric("akumulasi_penyusutan", { precision: 20, scale: 2 }),
        nilaiBuku: numeric("nilai_buku", { precision: 20, scale: 2 }),

        perangkatDaerahTujuan: text("perangkat_daerah_tujuan"),

        masterId: integer("master_id").references(() => alihStatusMasterTable.id).notNull(),
        createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
        createdBy: text("created_by").references(() => userTable.id),
        updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
        updatedBy: text("updated_by").references(() => userTable.id),
        deletedAt: timestamp("deleted_at", { withTimezone: true }).defaultNow().notNull(),
        deletedBy: text("deleted_by").references(() => userTable.id),
    },
    (table) => [
        index("alih_status_data_kode_barang_idx").on(table.kodeBarang),
        index("alih_status_data_kode_register_idx").on(table.kodeRegister),
        index("alih_status_data_master_idx").on(table.masterId),
    ],
);
