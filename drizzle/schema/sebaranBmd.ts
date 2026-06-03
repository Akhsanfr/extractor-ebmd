import { pgTable, varchar, text, timestamp, customType } from "drizzle-orm/pg-core";

// PostGIS geometry type
const geometry = customType<{ data: string; driverData: string }>({
    dataType() {
        return "geometry(MultiPolygon,4326)";
    },
});

export const sebaranBmd = pgTable("sebaran_bmd", {
    nibar: varchar("nibar", { length: 50 }).primaryKey(),
    polygon: geometry("polygon"),
    hak: text("hak"),
    nomor: text("nomor"),
    desa: text("desa"),
    updatedBy: text("updated_by"),
    pic: text("pic"),
    updatedAt: timestamp("updated_at", { withTimezone: true }),
});

export type BmdTanah = typeof sebaranBmd.$inferSelect;
export type BmdTanahInsert = typeof sebaranBmd.$inferInsert;