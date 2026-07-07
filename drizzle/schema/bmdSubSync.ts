import {
    pgTable,
    integer,
    varchar,
    text,
    boolean,
    timestamp,
    index,
    unique,
} from "drizzle-orm/pg-core";
import { bmdSubSyncStatusEnum, bmdAssetTypeEnum } from "./enum";
import { bmdSyncTable } from "./bmdSync";
import { perangkatDaerahTable } from "./perangkatDaerah";

export const bmdSubSyncTable = pgTable(
    "bmd_sub_sync",
    {
        id: integer().primaryKey().generatedAlwaysAsIdentity(),

        syncId: integer("bmd_sync_id")
            .notNull()
            .references(() => bmdSyncTable.id, { onDelete: "cascade" }),

        perangkatDaerahKodeLokasi: varchar("perangkat_daerah_kode_lokasi", { length: 30 })
            .notNull()
            .references(() => perangkatDaerahTable.kodeLokasi),

        assetType: bmdAssetTypeEnum("asset_type").notNull(),

        status: bmdSubSyncStatusEnum("status").default("pending").notNull(),

        /** Diminta berhenti (stop per-row) oleh user, dicek tiap chunk. */
        stopRequested: boolean("stop_requested").default(false).notNull(),

        totalData: integer("total_data").default(0).notNull(),
        successData: integer("success_data").default(0).notNull(),
        failedData: integer("failed_data").default(0).notNull(),

        retryCount: integer("retry_count").default(0).notNull(),

        /** Checkpoint: index baris (0-based) terakhir yang sudah diproses. */
        lastProcessedRow: integer("last_processed_row").default(0).notNull(),

        errorMessage: text("error_message"),

        startedAt: timestamp("started_at", { withTimezone: true }),
        finishedAt: timestamp("finished_at", { withTimezone: true }),

        createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
        updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
        deletedAt: timestamp("deleted_at", { withTimezone: true }),
    },
    (table) => ({
        syncIdx: index("bmd_sub_sync_sync_idx").on(table.syncId),
        opdIdx: index("bmd_sub_sync_opd_idx").on(table.perangkatDaerahKodeLokasi),
        uniqueCombo: unique("bmd_sub_sync_unique_combo").on(
            table.syncId,
            table.perangkatDaerahKodeLokasi,
            table.assetType,
        ),
    }),
);