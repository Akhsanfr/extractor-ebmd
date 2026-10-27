import {
    integer,
    numeric,
    timestamp,
    index,
    check,
    foreignKey,
    snakeCase,
    uniqueIndex,
} from "drizzle-orm/pg-core";
import { sql } from "drizzle-orm";
import { rekonTypeEnum, masterPerangkatDaerah } from "./../../schema";

export const rekonTable = snakeCase.table(
    "rekon",
    {
        id: integer().generatedAlwaysAsIdentity().primaryKey(),

        tahun: integer().notNull(),
        bulan: integer().notNull(),

        rekonType: rekonTypeEnum().notNull(),

        perangkatDaerahId: integer()
            .notNull()
            .references(() => masterPerangkatDaerah.id),

        realisasiAnggaran: numeric({
            precision: 20,
            scale: 2,
            mode: "number",
        }).notNull(),

        inputBMD: numeric({
            precision: 20,
            scale: 2,
            mode: "number",
        }).notNull(),

        createdAt: timestamp("created_at", {
            withTimezone: true,
        }).defaultNow().notNull(),

        updatedAt: timestamp("updated_at", {
            withTimezone: true,
        }).defaultNow().notNull(),
    },
    (table) => [
        uniqueIndex("rekon_tahun_bulan_type_pd_unique").on(
            table.tahun,
            table.bulan,
            table.rekonType,
            table.perangkatDaerahId,
        ),
        index().on(table.perangkatDaerahId),
        check(
            "rekon_bulan_check",
            sql`${table.bulan} BETWEEN 1 AND 12`,
        ),
    ],
);