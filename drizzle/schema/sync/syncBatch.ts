import { integer, json, jsonb, pgTable, text, timestamp, uniqueIndex } from "drizzle-orm/pg-core";
import { syncListTable } from "./syncList";
import { syncStatusEnum } from "../enum";
import { userTable } from "../auth";

export const syncBatchTable = pgTable("sync_batch", {
    /**
     * Primary key SyncBatch.
     */
    id: integer().generatedAlwaysAsIdentity().primaryKey(),

    /**
     * SyncList yang memiliki batch ini.
     */
    listId: integer()
        .references(() => syncListTable.id, {
            onDelete: "cascade",
        })
        .notNull(),

    /**
     * Nomor urut batch.
     *
     * Batch dimulai dari halaman ke-1.
     */
    batchPage: integer().notNull(),

    /**
     * Jumlah data maksimum yang diproses pada batch ini.
     */
    batchSize: integer().notNull(),

    /**
     * Status proses batch.
     */
    status: syncStatusEnum().default("pending").notNull(),

    /**
     * Jumlah retry batch.
     */
    retryCount: integer().default(0).notNull(),

    /**
     * Error terakhir pada batch.
     */
    lastError: text(),

    /**
     * User yang membuat batch.
     *
     * Nilainya biasanya mengikuti createdBy pada SyncJob.
     */
    createdBy: text("created_by").references(() => userTable.id).notNull(),

    /**
     * Waktu batch dibuat.
     */
    createdAt: timestamp({ withTimezone: true }).defaultNow().notNull(),

    /**
     * Waktu batch mulai diproses worker.
     */
    startedAt: timestamp({ withTimezone: true }),

    /**
     * Waktu batch selesai diproses.
     */
    finishedAt: timestamp({ withTimezone: true }),

    /**
     * User yang membatalkan batch.
     */
    abortBy: text("abort_by").references(() => userTable.id),

    /**
     * Waktu pembatalan batch.
     */
    abortAt: timestamp({ withTimezone: true }),

    /**
     * Alasan pembatalan batch.
     */
    abortReason: text(),
});