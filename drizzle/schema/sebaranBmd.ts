import { pgTable, varchar, text, timestamp, boolean, customType } from "drizzle-orm/pg-core";

// PostGIS geometry type
const geometry = customType<{ data: string; driverData: string }>({
    dataType() {
        return "geometry(MultiPolygon,4326)";
    },
});

export const sebaranBmd = pgTable("sebaran_bmd", {
    nibar: varchar("nibar", { length: 50 }).primaryKey(),
    nibel: varchar("nibel", { length: 50 }),
    polygon: geometry("polygon"),
    hak: text("hak"),
    nomor: text("nomor"),
    desa: text("desa"),
    updatedBy: text("updated_by"),
    pic: text("pic"),
    updatedAt: timestamp("updated_at", { withTimezone: true }),
    statusPlotting: boolean("status_plotting").default(null),  // ← baru
});

export type SebaranBmd = typeof sebaranBmd.$inferSelect;
export type SebaranBmdInsert = typeof sebaranBmd.$inferInsert;