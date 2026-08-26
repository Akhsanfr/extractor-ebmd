import { pgTable, serial, text, date, integer, timestamp, index } from "drizzle-orm/pg-core";
import { alihStatusMasterTable, userTable } from "./../../schema";

export const alihStatusPermohonanTable = pgTable(
    "alih_status_permohonan",
    {
        id: serial("id").primaryKey(),
        alasan: text("alasan"),
        suratNomor: text("surat_nomor"),
        suratTanggal: date("surat_tanggal"),
        suratHal: text("surat_hal"),
        masterId: integer("master_id").references(() => alihStatusMasterTable.id).notNull().unique(),
        createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
        createdBy: text("created_by").references(() => userTable.id),
        updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
        updatedBy: text("updated_by").references(() => userTable.id),
        deletedAt: timestamp("deleted_at", { withTimezone: true }).defaultNow().notNull(),
        deletedBy: text("deleted_by").references(() => userTable.id),
    },
    (table) => [
        index("alih_status_permohonan_surat_nomor_idx").on(table.suratNomor),
    ],
);
