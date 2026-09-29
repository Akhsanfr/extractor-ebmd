import { alihStatusPermohonanPenghapusanTable } from "@/drizzle/schema";
import { createInsertSchema, createSelectSchema } from "drizzle-zod";
import { z } from "zod";
import { AlihStatusBASTContract } from "../bast/contract";
import { AlihStatusDataContract } from "../data/contract";
import { AlihStatusPermohonanContract } from "../permohonan/contract";
import { AlihStatusBAPenelitianContract } from "../ba-penelitian/contract";
import { AlihStatusNodinContract } from "../nodin/contract";
import { AlihStatusPersetujuanBupatiContract } from "../persetujuan-bupati/contract";
import { AlihStatusTrackingContract } from "../tracking/contract";

export const AlihStatusPermohonanPenghapusanContract = {
    select: createSelectSchema(alihStatusPermohonanPenghapusanTable),
    selectWithDetail: z.object({
        data: AlihStatusDataContract.select.array(),
        permohonan: AlihStatusPermohonanContract.select.array(),
        BAPenelitian: AlihStatusBAPenelitianContract.select.array(),
        nodin: AlihStatusNodinContract.select.array(),
        persetujuanBupati: AlihStatusPersetujuanBupatiContract.select.array(),
        bast: AlihStatusBASTContract.select.array(),
        permohonanPenghapusan: createSelectSchema(alihStatusPermohonanPenghapusanTable),
        tracking: AlihStatusTrackingContract.select.array()
    }),


    create: createInsertSchema(alihStatusPermohonanPenghapusanTable)
        .extend({
            dataIds: z.number().array()
        })
        .omit({ createdAt: true, createdBy: true }),

    insert: createInsertSchema(alihStatusPermohonanPenghapusanTable).extend({
        dataIds: z.number().array()
    }),

    edit: createInsertSchema(alihStatusPermohonanPenghapusanTable)
        .extend({ id: z.number().int().positive() })
        .omit({ createdAt: true, createdBy: true }),
    update: createInsertSchema(alihStatusPermohonanPenghapusanTable)
        .extend({ id: z.number().int().positive() })
        .omit({ createdAt: true, createdBy: true }),

    delete: z.object({ id: z.number().int().positive() }),
    remove: z.object({
        id: z.number().int().positive(),
        deletedAt: z.date().default(new Date()),
        deletedBy: z.string(),
    }),
};

export namespace AlihStatusPermohonanPenghapusanContract {
    export type SelectDTO = z.infer<typeof AlihStatusPermohonanPenghapusanContract.select>;
    export type SelectWithDetailDTO = z.infer<typeof AlihStatusPermohonanPenghapusanContract.selectWithDetail>;
    export type CreateDTO = z.infer<typeof AlihStatusPermohonanPenghapusanContract.create>;
    export type InsertDTO = z.infer<typeof AlihStatusPermohonanPenghapusanContract.insert>;
    export type EditDTO = z.infer<typeof AlihStatusPermohonanPenghapusanContract.edit>;
    export type UpdateDTO = z.infer<typeof AlihStatusPermohonanPenghapusanContract.update>;
    export type DeleteDTO = z.infer<typeof AlihStatusPermohonanPenghapusanContract.delete>;
    export type RemoveDTO = z.infer<typeof AlihStatusPermohonanPenghapusanContract.remove>;
}
