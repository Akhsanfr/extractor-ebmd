import {
    text,
    timestamp,
    snakeCase,
    integer,
    date
} from "drizzle-orm/pg-core";
import { alihStatusTrackingSourceType } from "../enum";
import { userTable } from "../auth";

export const alihStatusTrackingTable = snakeCase.table("alih_status_tracking", {
    id: integer().generatedAlwaysAsIdentity().primaryKey(),

    sourceType: alihStatusTrackingSourceType().notNull(),
    sourceId: integer().notNull(),

    position: text().notNull(),
    date: date().notNull(),

    note: text(),


    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
    createdBy: text("created_by").references(() => userTable.id),
    updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
    updatedBy: text("updated_by").references(() => userTable.id),
});