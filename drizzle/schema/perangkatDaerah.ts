import { pgTable, text, timestamp, varchar } from "drizzle-orm/pg-core";

export const perangkatDaerahTable = pgTable("perangkat_daerah", {
    kodeLokasi: varchar("kode_lokasi", { length: 30 }).primaryKey(),
    namaLokasi: text("nama_lokasi").notNull(),
    jabatan: varchar("jabatan", { length: 50 }).notNull(),
    createdAt: timestamp("created_at").notNull().defaultNow(),
    updatedAt: timestamp("updated_at").notNull().defaultNow(),
    createdBy: text("created_by"),
    updatedBy: text("updated_by"),
});

export type PerangkatDaerahTable = typeof perangkatDaerahTable;