import { serial, integer, text, timestamp, index, uniqueIndex, snakeCase } from "drizzle-orm/pg-core";
import { userTable } from "..";
import { alihStatusMasterTable } from "./alihStatusMaster";
import { alihStatusGroupPersetujuanTable } from "./alihStatusGroupPersetujuan";

export const alihStatusGroupPersetujuanMasterTable = snakeCase.table(
    "alih_status_group_persetujuan_master",
    {
        id: serial().primaryKey(),
        groupId: integer().references(() => alihStatusGroupPersetujuanTable.id).notNull(),
        masterId: integer().references(() => alihStatusMasterTable.id).notNull(),
        createdAt: timestamp({ withTimezone: true }).defaultNow().notNull(),
        createdBy: text().references(() => userTable.id),
    },
    (table) => [
        // 1 master hanya boleh berada di 1 group
        uniqueIndex("alih_status_group_master_master_unique_idx")
            .on(table.masterId),

        // mempercepat pencarian semua master dalam group
        index("alih_status_group_master_group_idx")
            .on(table.groupId),
    ],
);
