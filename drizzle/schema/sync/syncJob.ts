import { integer, jsonb, pgTable, text, timestamp } from "drizzle-orm/pg-core";
import { syncJobTypeEnum, syncStatusEnum } from "../enum";
import { userTable } from "../auth";

// Table utama JOB


export const syncJobTable = pgTable("sync_job", {
    /**
     * Primary key dari job sinkronisasi.
     */
    id: integer().generatedAlwaysAsIdentity().primaryKey(),

    /**
     * Nama job yang mudah dikenali oleh pengguna.
     *
     * Contoh:
     * - Sinkronisasi Aset Tahun 2026
     * - Sinkronisasi Persediaan Semester I
     */
    name: text().notNull(),

    /**
     * Jenis worker yang akan digunakan untuk menjalankan job.
     *
     * Worker menentukan bagaimana proses sinkronisasi dilakukan.
     */
    jobType: syncJobTypeEnum("job_type").notNull(),

    /**
     * Status keseluruhan job.
     */
    status: syncStatusEnum().default("pending").notNull(),

    /**
     * Total SyncList yang harus diproses.
     */
    totalList: integer().default(0).notNull(),

    /**
     * Jumlah SyncList yang berhasil selesai.
     */
    completedList: integer().default(0).notNull(),

    /**
     * Jumlah SyncList yang gagal diproses.
     */
    failedList: integer().default(0).notNull(),

    /**
     * User yang membuat job.
     */
    createdBy: text("created_by").references(() => userTable.id).notNull(),

    /**
     * Waktu job dibuat.
     */
    createdAt: timestamp({ withTimezone: true }).defaultNow().notNull(),

    /**
     * Waktu pertama kali job mulai diproses.
     */
    startedAt: timestamp({ withTimezone: true }),

    /**
     * Waktu seluruh SyncList selesai diproses.
     */
    finishedAt: timestamp({ withTimezone: true }),

    /**
     * User yang membatalkan job secara manual.
     */
    abortBy: text("abort_by").references(() => userTable.id),

    /**
     * Waktu pembatalan dilakukan.
     */
    abortAt: timestamp({ withTimezone: true }),

    /**
     * Alasan pembatalan oleh pengguna.
     */
    abortReason: text(),
});