import {
    integer,
    text,
    numeric,
    timestamp,
    index,
    snakeCase,
} from "drizzle-orm/pg-core";
import { alihStatusBAPenelitianTable, alihStatusBASTTable, alihStatusMasterTable, alihStatusNodinTable, alihStatusPermohonanPenghapusanTable, alihStatusPermohonanTable, alihStatusPersetujuanBupatiTable, alihStatusSKHapusTable, alihStatusSpkmbTable, bmdAssetTypeEnum, userTable } from "./../../schema";

export const alihStatusDataTable = snakeCase.table(
    "alih_status_data",
    {
        id: integer("id").generatedAlwaysAsIdentity().primaryKey(),

        assetType: bmdAssetTypeEnum(),

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

        jumlah: numeric({ precision: 20, scale: 2 }),
        luas: numeric({ precision: 20, scale: 2 }),

        nilaiPerolehan: numeric("nilai_perolehan", { precision: 20, scale: 2 }).notNull(),
        akumulasiPenyusutan: numeric("akumulasi_penyusutan", { precision: 20, scale: 2 }).notNull(),
        nilaiBuku: numeric("nilai_buku", { precision: 20, scale: 2 }).notNull(),

        perangkatDaerahAsal: text(),
        perangkatDaerahTujuan: text("perangkat_daerah_tujuan").notNull(),

        spkmbId: integer()
            .references(() => alihStatusSpkmbTable.id, {
                onDelete: "set null",
            }),

        permohonanId: integer()
            .references(() => alihStatusPermohonanTable.id, {
                onDelete: "set null",
            }),

        BAPenelitianId: integer()
            .references(() => alihStatusBAPenelitianTable.id, {
                onDelete: "set null",
            }),

        nodinId: integer()
            .references(() => alihStatusNodinTable.id, {
                onDelete: "set null",
            }),

        persetujuanBupatiId: integer()
            .references(() => alihStatusPersetujuanBupatiTable.id, {
                onDelete: "set null",
            }),

        bastId: integer()
            .references(() => alihStatusBASTTable.id, {
                onDelete: "set null",
            }),

        permohonanPenghapusanId: integer()
            .references(() => alihStatusPermohonanPenghapusanTable.id, {
                onDelete: "set null",
            }),

        SKHapusId: integer()
            .references(() => alihStatusSKHapusTable.id, {
                onDelete: "set null",
            }),
        createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
        createdBy: text("created_by").references(() => userTable.id),
        updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
        updatedBy: text("updated_by").references(() => userTable.id),
    },
    (table) => [index().on(table.tahun)],
);
