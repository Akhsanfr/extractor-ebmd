import { pgTable, serial, text, date, integer, timestamp, index, snakeCase } from "drizzle-orm/pg-core";
import { alihStatusMasterTable, alihStatusTypeEnum, userTable } from "./../../schema";
import { AlihStatusType } from "@/enum/alihStatus";

export const alihStatusPermohonanTable = snakeCase.table(
    "alih_status_permohonan",
    {
        id: serial("id").primaryKey(),
        alihStatusType: alihStatusTypeEnum().notNull(),
        alasan: text("alasan"),
        suratNomor: text("surat_nomor"),
        suratTanggal: date("surat_tanggal"),
        suratHal: text("surat_hal"),
        tahun: integer().notNull(),
        perangkatDaerahAsal: text().notNull(),
        penggunaBarangAsalNama: text(),
        penggunaBarangAsalNIP: text(),
        penggunaBarangAsalJabatan: text(),
        penggunaBarangAsalPangkat: text(),
        createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
        createdBy: text("created_by").references(() => userTable.id),
        updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
        updatedBy: text("updated_by").references(() => userTable.id),
        deletedAt: timestamp("deleted_at", { withTimezone: true }).defaultNow().notNull(),
        deletedBy: text("deleted_by").references(() => userTable.id),
    },
    (table) => [index().on(table.tahun)],
);
