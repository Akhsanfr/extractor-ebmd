import { alihStatusSKHapusTable } from "@/drizzle/schema";
import { createInsertSchema, createSelectSchema } from "drizzle-zod";
import { z } from "zod";
import { AlihStatusPermohonanPenghapusanContract } from "../permohonan-penghapusan/contract";
import { AlihStatusDataContract } from "../data/contract";
import { AlihStatusPermohonanContract } from "../permohonan/contract";
import { AlihStatusBAPenelitianContract } from "../ba-penelitian/contract";
import { AlihStatusNodinContract } from "../nodin/contract";
import { AlihStatusPersetujuanBupatiContract } from "../persetujuan-bupati/contract";
import { AlihStatusBASTContract } from "../bast/contract";

export const AlihStatusSKHapusContract = {
    select: createSelectSchema(alihStatusSKHapusTable),
    selectWithDetail: z.object({
        data: AlihStatusDataContract.select.array(),
        permohonan: AlihStatusPermohonanContract.select.array(),
        BAPenelitian: AlihStatusBAPenelitianContract.select.array(),
        nodin: AlihStatusNodinContract.select.array(),
        persetujuanBupati: AlihStatusPersetujuanBupatiContract.select.array(),
        bast: AlihStatusBASTContract.select.array(),
        permohonanPenghapusan: AlihStatusPermohonanPenghapusanContract.select.array(),
        SKHapus: createSelectSchema(alihStatusSKHapusTable)
    }),

    create: createInsertSchema(alihStatusSKHapusTable).extend({
        dataIds: z.number().array()
    }).omit({ createdAt: true, createdBy: true }),

    insert: createInsertSchema(alihStatusSKHapusTable),

    edit: createInsertSchema(alihStatusSKHapusTable)
        .extend({ id: z.number().int().positive() })
        .omit({ createdAt: true, createdBy: true }),
    update: createInsertSchema(alihStatusSKHapusTable)
        .extend({ id: z.number().int().positive(), createdBy: z.string(), updatedAt: z.date(), updatedBy: z.string() })
        .omit({ createdAt: true, createdBy: true }),

    delete: z.object({ id: z.number().int().positive() }),
    remove: z.object({
        id: z.number().int().positive(),
        deletedAt: z.date().default(new Date()),
        deletedBy: z.string(),
    }),
};

export namespace AlihStatusSKHapusContract {
    export type SelectDTO = z.infer<typeof AlihStatusSKHapusContract.select>;
    export type SelectWithDetailDTO = z.infer<typeof AlihStatusSKHapusContract.selectWithDetail>;
    export type CreateDTO = z.infer<typeof AlihStatusSKHapusContract.create>;
    export type InsertDTO = z.infer<typeof AlihStatusSKHapusContract.insert>;
    export type EditDTO = z.infer<typeof AlihStatusSKHapusContract.edit>;
    export type UpdateDTO = z.infer<typeof AlihStatusSKHapusContract.update>;
    export type DeleteDTO = z.infer<typeof AlihStatusSKHapusContract.delete>;
    export type RemoveDTO = z.infer<typeof AlihStatusSKHapusContract.remove>;
}
