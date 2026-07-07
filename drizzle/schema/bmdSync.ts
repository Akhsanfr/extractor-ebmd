import { pgTable, integer, boolean, text, timestamp } from "drizzle-orm/pg-core";
import { bmdSyncStatusEnum } from "./enum";

export const bmdSyncTable = pgTable("bmd_sync", {
    id: integer().primaryKey().generatedAlwaysAsIdentity(),

    status: bmdSyncStatusEnum("status").default("pending").notNull(),

    /** Diminta berhenti (pause/stop) oleh user. Dicek oleh engine tiap chunk & tiap pindah sub-sync. */
    stopRequested: boolean("stop_requested").default(false).notNull(),

    totalSubSync: integer("total_sub_sync").default(0).notNull(),
    successSubSync: integer("success_sub_sync").default(0).notNull(),
    failedSubSync: integer("failed_sub_sync").default(0).notNull(),

    createdBy: text("created_by").notNull(),

    startedAt: timestamp("started_at", { withTimezone: true }),
    finishedAt: timestamp("finished_at", { withTimezone: true }),

    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
    deletedAt: timestamp("deleted_at", { withTimezone: true }),
});