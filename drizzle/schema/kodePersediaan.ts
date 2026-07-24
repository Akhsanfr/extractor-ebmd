import { InferInsertModel, InferSelectModel } from "drizzle-orm";
import {
    integer,
    pgTable,
    text,
    timestamp,
    varchar,
} from "drizzle-orm/pg-core";

export const kodePersediaan = pgTable("kode_persediaan", {
    id: integer("id").generatedAlwaysAsIdentity().primaryKey(),

    /**
     * Kode kelompok (108)
     * Contoh: 1.1.7.01.01.01.012
     */
    kode108: varchar("kode_108", { length: 30 }).notNull(),

    kategori: text("kategori"),

    /**
     * Nama kelompok
     * Contoh: Besi Beton
     */
    nama108: varchar("nama_108", { length: 255 }).notNull(),

    /**
     * Kode NUSP
     * Contoh: 1.1.7.01.01.01.012.0044
     */
    kodeNusp: varchar("kode_nusp", { length: 40 }).notNull().unique(),

    /**
     * Nama barang NUSP
     * Contoh: Kawat Las
     */
    namaBarang: varchar("nama_barang", { length: 255 }).notNull(),

    /**
     * Satuan
     * Contoh: Buah
     */
    satuan: varchar("satuan", { length: 100 }).notNull(),

    /**
     * Sinonim / keyword tambahan.
     * Contoh:
     * elektroda, welding rod
     */
    keywords: varchar("keywords", { length: 1000 }),

    /**
     * Hash dari data yang digunakan untuk embedding.
     * Digunakan untuk mendeteksi apakah embedding sudah tidak sinkron.
     */
    contentHash: varchar("content_hash", { length: 64 }),

    createdAt: timestamp("created_at", {
        mode: "date",
        withTimezone: true,
    })
        .notNull()
        .defaultNow(),

    updatedAt: timestamp("updated_at", {
        mode: "date",
        withTimezone: true,
    })
        .notNull()
        .defaultNow(),

    deletedAt: timestamp("deleted_at", {
        mode: "date",
        withTimezone: true,
    }),
});

export type SelectKodePersediaan = InferSelectModel<typeof kodePersediaan>;
export type InsertKodePersediaan = InferInsertModel<typeof kodePersediaan>;