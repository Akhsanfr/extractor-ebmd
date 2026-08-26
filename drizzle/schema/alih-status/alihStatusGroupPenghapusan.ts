import { pgTable, serial, text, integer, timestamp, snakeCase } from "drizzle-orm/pg-core";
import { userTable } from "..";

export const alihStatusGroupPenghapusanTable = snakeCase.table(
    "alih_status_group_penghapusan",
    {
        id: serial().primaryKey(),
        nama: text().notNull(),
        createdAt: timestamp({ withTimezone: true }).defaultNow().notNull(),
        createdBy: text().references(() => userTable.id),
        updatedAt: timestamp({ withTimezone: true }).defaultNow().notNull(),
        updatedBy: text().references(() => userTable.id),
        deletedAt: timestamp({ withTimezone: true }).defaultNow().notNull(),
        deletedBy: text().references(() => userTable.id),
    },
);
