import { boolean, pgTable, text, timestamp, varchar } from "drizzle-orm/pg-core";
import { perangkatDaerahTable } from "./perangkatDaerah";

export const rkbmdBaTable = pgTable("rkbmd_ba", {
    perangkatDaerahId: varchar("perangkat_daerah_id", { length: 30 })
        .primaryKey()
        .references(() => perangkatDaerahTable.kodeLokasi, { onDelete: "cascade" }),
    pengantar: boolean("pengantar").notNull().default(false),
    pengadaan: boolean("pengadaan").notNull().default(false),
    pemeliharaan: boolean("pemeliharaan").notNull().default(false),
    namaPeserta: text("nama_peserta"),
    nipPeserta: varchar("nip_peserta", { length: 30 }),
    updatedAt: timestamp("updated_at").notNull().defaultNow(),
    updatedBy: text("updated_by"),
});