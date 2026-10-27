import {
    pgEnum,
    integer,
    varchar,
    timestamp,
    index,
    snakeCase,
} from "drizzle-orm/pg-core";

export const levelPerangkatDaerahEnum = pgEnum(
    "level_perangkat_daerah",
    ["PenggunaBarang", "KuasaPenggunaBarang"],
);

export const masterPerangkatDaerah = snakeCase.table(
    "master_perangkat_daerah",
    {
        id: integer().generatedAlwaysAsIdentity().primaryKey(),

        tahun: integer().notNull(),

        nama: varchar({ length: 255 }).notNull(),

        createdAt: timestamp("created_at", {
            withTimezone: true,
        })
            .defaultNow()
            .notNull(),

        updatedAt: timestamp("updated_at", {
            withTimezone: true,
        })
            .defaultNow()
            .notNull(),
    },
    (table) => [
        index("master_perangkat_daerah_tahun_idx").on(table.tahun),
    ],
);