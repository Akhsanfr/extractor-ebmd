import { pgTable, serial, text, date, integer, timestamp, index } from "drizzle-orm/pg-core";
import { alihStatusMasterTable, userTable } from "./../../schema";

export const alihStatusBAPenelitianTable = pgTable(
    "alih_status_ba_penelitian",
    {
        id: serial("id").primaryKey(),
        masterId: integer("master_id").references(() => alihStatusMasterTable.id).notNull(),
        suratNomor: text("surat_nomor"),
        suratTanggal: date("surat_tanggal"),
        suratHal: text("surat_hal"),
        createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
        createdBy: text("created_by").references(() => userTable.id),
        updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
        updatedBy: text("updated_by").references(() => userTable.id),
        deletedAt: timestamp("deleted_at", { withTimezone: true }).defaultNow().notNull(),
        deletedBy: text("deleted_by").references(() => userTable.id),
    },
    (table) => [index("alih_status_ba_penelitian_permohonan_idx").on(table.masterId)],
);
