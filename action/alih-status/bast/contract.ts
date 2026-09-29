import { alihStatusBASTTable } from "@/drizzle/schema";
import { createInsertSchema, createSelectSchema } from "drizzle-zod";
import { z } from "zod";
import { AlihStatusDataContract } from "../data/contract";
import { AlihStatusPermohonanContract } from "../permohonan/contract";
import { AlihStatusBAPenelitianContract } from "../ba-penelitian/contract";
import { AlihStatusNodinContract } from "../nodin/contract";
import { AlihStatusPersetujuanBupatiContract } from "../persetujuan-bupati/contract";
import { AlihStatusTrackingContract } from "../tracking/contract";

export const AlihStatusBASTContract = {
    query: z.object({
        groupPersetujuanBupatiId: z.number(),
    }),
    select: createSelectSchema(alihStatusBASTTable),
    selectWithDetail: z.object({
        data: AlihStatusDataContract.select.array(),
        permohonan: AlihStatusPermohonanContract.select.array(),
        BAPenelitian: AlihStatusBAPenelitianContract.select.array(),
        nodin: AlihStatusNodinContract.select.array(),
        persetujuanBupati: AlihStatusPersetujuanBupatiContract.select.array(),
        bast: createSelectSchema(alihStatusBASTTable),
        tracking: AlihStatusTrackingContract.select.array()
    }),
    penggunaBarang: z.object({
        asal: z.object({
            nama: z.string().nullable(),
            pangkat: z.string().nullable(),
            nip: z.string().nullable(),
            jabatan: z.string().nullable(),
        }),
        tujuan: z.object({
            nama: z.string(),
            pangkat: z.string(),
            nip: z.string(),
            jabatan: z.string().nullable(),
        })
    }),

    create: createInsertSchema(alihStatusBASTTable).extend({
        dataIds: z.number().array()
    })
        .omit({ createdAt: true, createdBy: true }),

    setPermohonanPenghapusanId: z.object({
        bastId: z.number().array(),
        permohonanPenghapusanId: z.number()
    }),

    insert: createInsertSchema(alihStatusBASTTable).extend({
        dataIds: z.number().array()
    }),

    edit: createInsertSchema(alihStatusBASTTable)
        .extend({ id: z.number().int().positive() })
        .omit({ createdAt: true, createdBy: true }),
    update: createInsertSchema(alihStatusBASTTable)
        .extend({ id: z.number().int().positive(), createdBy: z.string(), updatedAt: z.date(), updatedBy: z.string() })
        .omit({ createdAt: true, createdBy: true }),

    delete: z.object({ id: z.number().int().positive() }),
    remove: z.object({
        id: z.number().int().positive()
    }),
};

export namespace AlihStatusBASTContract {
    export type QueryDTO = z.infer<typeof AlihStatusBASTContract.query>;
    export type PenggunaBarangDTO = z.infer<typeof AlihStatusBASTContract.penggunaBarang>;
    export type SelectWithDetailDTO = z.infer<typeof AlihStatusBASTContract.selectWithDetail>;
    export type SelectDTO = z.infer<typeof AlihStatusBASTContract.select>;
    export type CreateDTO = z.infer<typeof AlihStatusBASTContract.create>;
    export type SetPermohonanPenghapusanIdDTO = z.infer<typeof AlihStatusBASTContract.setPermohonanPenghapusanId>;
    export type InsertDTO = z.infer<typeof AlihStatusBASTContract.insert>;
    export type EditDTO = z.infer<typeof AlihStatusBASTContract.edit>;
    export type UpdateDTO = z.infer<typeof AlihStatusBASTContract.update>;
    export type DeleteDTO = z.infer<typeof AlihStatusBASTContract.delete>;
    export type RemoveDTO = z.infer<typeof AlihStatusBASTContract.remove>;
}
