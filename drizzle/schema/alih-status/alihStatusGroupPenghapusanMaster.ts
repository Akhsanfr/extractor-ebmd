import { serial, integer, text, timestamp, index, uniqueIndex, snakeCase } from "drizzle-orm/pg-core";
import { userTable } from "..";
import { alihStatusMasterTable } from "./alihStatusMaster";
import { alihStatusGroupPenghapusanTable } from "./alihStatusGroupPenghapusan";

export const alihStatusGroupPenghapusanMasterTable = snakeCase.table(
    "alih_status_group_penghapusan_master",
    {
        id: serial().primaryKey(),
        groupId: integer().references(() => alihStatusGroupPenghapusanTable.id).notNull(),
        masterId: integer().references(() => alihStatusMasterTable.id).notNull(),
        createdAt: timestamp({ withTimezone: true }).defaultNow().notNull(),
        createdBy: text().references(() => userTable.id),
    },
    (table) => [
        uniqueIndex().on(table.groupId, table.masterId),
        index().on(table.groupId),
        index().on(table.masterId),
    ],
);
