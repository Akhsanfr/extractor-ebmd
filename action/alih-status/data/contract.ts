import { alihStatusDataTable } from "@/drizzle/schema";
import { BmdAssetType } from "@/enum/bmd";
import { createInsertSchema, createSelectSchema } from "drizzle-zod";
import { z } from "zod";
z.config(z.locales.id());


const baseSelect = createSelectSchema(alihStatusDataTable).omit({ createdAt: true, createdBy: true, updatedAt: true, updatedBy: true })

export const AlihStatusDataContract = {
    query: z.object({
        tahun: z.number().optional(),
        spkmbId: z.number().array().optional(),
        permohonanId: z.number().array().optional(),
        BAPenelitianId: z.number().array().optional(),
        nodinId: z.number().array().optional(),
        persetujuanBupatiId: z.number().array().optional(),
        bastId: z.number().array().optional(),
        permohonanPenghapusanId: z.number().array().optional(),
        SKHapusId: z.number().array().optional(),
    }),
    select: baseSelect.extend({
        // perangkatDaerahAsal: z.string(),
        assetType: z.enum(BmdAssetType).nullable()
    }),

    selectWithGroupTujuan: baseSelect.extend({
        perangkatDaerahAsal: z.string(),
        totalNilaiPerolehan: z.number(),
        jumlahBarang: z.number(),
    }),

    create: createInsertSchema(alihStatusDataTable).extend({
        assetType: z.enum(BmdAssetType)
    })
        .omit({ createdAt: true, createdBy: true }),

    insert: createInsertSchema(alihStatusDataTable).extend({
        assetType: z.enum(BmdAssetType)
    }),
    importItem: baseSelect
        .extend({ assetType: z.enum(BmdAssetType) })
        .omit({ id: true }).array(),

    importData: z.object({
        data: z.instanceof(File),
        permohonanId: z.number(),
    }),


    edit: createInsertSchema(alihStatusDataTable)
        .extend({ id: z.number().int().positive(), assetType: z.enum(BmdAssetType) })
        .omit({ createdAt: true, createdBy: true }),
    update: createInsertSchema(alihStatusDataTable)
        .extend({ id: z.number().int().positive(), createdBy: z.string(), updatedAt: z.date(), updatedBy: z.string(), assetType: z.enum(BmdAssetType) })
        .omit({ createdAt: true, createdBy: true }),

    link: z.object({
        spkmbId: z.number().int().positive().optional(),
        permohonanId: z.number().int().positive().optional(),
        BAPenelitianId: z.number().int().positive().optional(),
        nodinId: z.number().int().positive().optional(),
        persetujuanBupatiId: z.number().int().positive().optional(),
        bastId: z.number().int().positive().optional(),
        permohonanPenghapusanId: z.number().int().positive().optional(),
        SKHapusId: z.number().int().positive().optional(),
    }),
    unlink: z.object({
        spkmbId: z.literal(true).optional(),
        permohonanId: z.literal(true).optional(),
        BAPenelitianId: z.literal(true).optional(),
        nodinId: z.literal(true).optional(),
        persetujuanBupatiId: z.literal(true).optional(),
        bastId: z.literal(true).optional(),
        permohonanPenghapusanId: z.literal(true).optional(),
        SKHapusId: z.literal(true).optional(),
    }),

    delete: z.object({ id: z.number().int().positive() }),
    remove: z.object({
        id: z.number().int().positive()
    }),
};

export namespace AlihStatusDataContract {
    export type QueryDTO = z.infer<typeof AlihStatusDataContract.query>;
    export type SelectDTO = z.infer<typeof AlihStatusDataContract.select>;
    export type SelectWithGroupTujuanDTO = z.infer<typeof AlihStatusDataContract.selectWithGroupTujuan>;
    export type CreateDTO = z.infer<typeof AlihStatusDataContract.create>;
    export type InsertDTO = z.infer<typeof AlihStatusDataContract.insert>;
    export type ImportItemDTO = z.infer<typeof AlihStatusDataContract.importItem>;
    export type ImportDataDTO = z.infer<typeof AlihStatusDataContract.importData>;
    export type EditDTO = z.infer<typeof AlihStatusDataContract.edit>;
    export type UpdateDTO = z.infer<typeof AlihStatusDataContract.update>;
    export type DeleteDTO = z.infer<typeof AlihStatusDataContract.delete>;
    export type RemoveDTO = z.infer<typeof AlihStatusDataContract.remove>;
    export type LinkDTO =
        z.infer<typeof AlihStatusDataContract.link>;
    export type UnlinkDTO =
        z.infer<typeof AlihStatusDataContract.unlink>;
}
