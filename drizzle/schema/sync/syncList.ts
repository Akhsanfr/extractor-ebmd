import { integer, jsonb, pgTable, text, timestamp } from "drizzle-orm/pg-core";
import { syncJobTable } from "./syncJob";
import { syncStatusEnum } from "../enum";
import { userTable } from "../auth";

export const syncListTable = pgTable("sync_list", {
    /**
     * Primary key SyncList.
     */
    id: integer().generatedAlwaysAsIdentity().primaryKey(),

    /**
     * Job yang memiliki SyncList ini.
     */
    jobId: integer()
        .references(() => syncJobTable.id, {
            onDelete: "cascade",
        })
        .notNull(),

    /**
     * Parameter yang diperlukan untuk mengambil data.
     *
     * Struktur payload bergantung pada provider.
     */
    payload: jsonb().$type<Record<string, unknown>>().notNull(),

    /**
     * Metadata hasil proses download.
     *
     * Digunakan agar retry tidak perlu mengunduh ulang resource.
     *
     * Contoh:
     * {
     *   file: "...",
     *   totalRows: 12000,
     *   checksum: "..."
     * }
     */
    resource: jsonb().$type<Record<string, unknown>>(),

    /**
     * Status proses SyncList.
     */
    status: syncStatusEnum().default("pending").notNull(),

    /**
     * Total SyncBatch yang dibuat dari resource ini.
     */
    totalBatch: integer().default(0).notNull(),

    /**
     * Jumlah SyncBatch yang berhasil diproses.
     */
    completedBatch: integer().default(0).notNull(),

    /**
     * Jumlah SyncBatch yang gagal diproses.
     */
    failedBatch: integer().default(0).notNull(),

    /**
     * Jumlah retry proses download.
     */
    retryCount: integer().default(0).notNull(),

    /**
     * Error terakhir ketika memproses SyncList.
     */
    lastError: text(),

    /**
     * User yang membuat SyncList.
     */
    createdBy: text("created_by").references(() => userTable.id).notNull(),

    /**
     * Waktu SyncList dibuat.
     */
    createdAt: timestamp({ withTimezone: true }).defaultNow().notNull(),

    /**
     * Waktu download mulai dijalankan.
     */
    startedAt: timestamp({ withTimezone: true }),

    /**
     * Waktu seluruh batch selesai diproses.
     */
    finishedAt: timestamp({ withTimezone: true }),

    /**
     * User yang membatalkan proses.
     */
    abortBy: text("abort_by").references(() => userTable.id),

    /**
     * Waktu pembatalan.
     */
    abortAt: timestamp({ withTimezone: true }),

    /**
     * Alasan pembatalan.
     */
    abortReason: text(),
});