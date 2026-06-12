import { pgTable, text, numeric, varchar } from "drizzle-orm/pg-core";
import { perangkatDaerahTable } from "./perangkatDaerah";

export const bmd = pgTable("bmd", {
    nibar: text("nibar").primaryKey(),
    nomorRegister: text("nomor_register").notNull(),
    kodeBarang: text("kode_barang").notNull(),
    namaBarang: text("nama_barang").notNull(),
    spesifikasiNamaBarang: text("spesifikasi_nama_barang").notNull(),
    spesifikasiLainnya: text("spesifikasi_lainnya"),
    jumlah: numeric("jumlah", {
        precision: 18,
        scale: 2,
    }).notNull(),
    satuan: text("satuan"),
    lokasi: text("lokasi").notNull(),
    perangkatDaerahId: varchar("perangkat_daerah_id", { length: 30 })
        .references(() => perangkatDaerahTable.kodeLokasi, { onDelete: "cascade" }),
});