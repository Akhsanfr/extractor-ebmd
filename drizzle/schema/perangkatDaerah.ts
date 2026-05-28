import { pgTable, serial, varchar, text } from "drizzle-orm/pg-core";

export const lokasi = pgTable("lokasi", {
    id: serial("id").primaryKey(),
    kodeLokasi: text("kode_lokasi").notNull().unique(),
    namaLokasi: text("nama_lokasi").notNull(),
    jabatan: text("jabatan").notNull(),
});