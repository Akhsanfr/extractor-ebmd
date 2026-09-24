import {
    pgTable,
    serial,
    text,
    integer,
    timestamp,
    index,
    snakeCase,
} from "drizzle-orm/pg-core";
import { alihStatusBASTTable, alihStatusTypeEnum, userTable } from "./../../schema";

export const alihStatusMasterTable = snakeCase.table(
    "alih_status_master",
    {
        id: serial("id").primaryKey(),
        nama: text(),
        alihStatusType: alihStatusTypeEnum(),
        perangkatDaerahAsal: text("perangkat_daerah_asal").notNull(),
        penggunaBarangNama: text("pengguna_barang_nama"),
        penggunaBarangNIP: text("pengguna_barang_nip"),
        penggunaBarangPangkat: text("pengguna_barang_pangkat"),
        penggunaBarangJabatan: text("pengguna_barang_jabatan"),
        pengurusBarangNama: text("pengurus_barang_nama"),
        bastId: integer().references(() => alihStatusBASTTable.id),
        createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
        createdBy: text("created_by").references(() => userTable.id),
        updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
        updatedBy: text("updated_by").references(() => userTable.id),
        deletedAt: timestamp("deleted_at", { withTimezone: true }).defaultNow().notNull(),
        deletedBy: text("deleted_by").references(() => userTable.id),
    },
    (table) => [
        index("alih_status_master_perangkat_daerah_asal_idx").on(table.perangkatDaerahAsal),
    ],
);
