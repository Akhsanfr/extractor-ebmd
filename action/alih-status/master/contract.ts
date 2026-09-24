import { alihStatusMasterTable } from "@/drizzle/schema";
import { AlihStatusType } from "@/enum/alihStatus";
import { createInsertSchema, createSelectSchema } from "drizzle-zod";
import { z } from "zod";

export const AlihStatusMasterContract = {
    select: createSelectSchema(alihStatusMasterTable),
    selectWithSumData: createSelectSchema(alihStatusMasterTable).extend({
        persetujuan: z.string().nullable(),
        penghapusan: z.string().nullable(),
        totalNilaiPerolehan: z.number(),
        jumlahBarang: z.number()
    }),
    selectWithSumDataByGroup: createSelectSchema(alihStatusMasterTable).extend({
        totalNilaiPerolehan: z.number(),
        jumlahBarang: z.number()
    }),

    create: createInsertSchema(alihStatusMasterTable)
        .extend({
            alihStatusType: z.enum(AlihStatusType)
        })
        .omit({ createdAt: true, createdBy: true }),
    import: createInsertSchema(alihStatusMasterTable)
        .extend({
            alihStatusType: z.enum(AlihStatusType)
        })
        .omit({ createdAt: true, createdBy: true })
        .array(),

    insert: createInsertSchema(alihStatusMasterTable)
        .extend({
            alihStatusType: z.enum(AlihStatusType)
        }),

    edit: createInsertSchema(alihStatusMasterTable)
        .extend({
            id: z.number().int().positive(),
            alihStatusType: z.enum(AlihStatusType)
        })
        .omit({ createdAt: true, createdBy: true }),
    update: createInsertSchema(alihStatusMasterTable)
        .extend({
            id: z.number().int().positive(), createdBy: z.string(), updatedAt: z.date(), updatedBy: z.string(),
            alihStatusType: z.enum(AlihStatusType)
        })
        .omit({ createdAt: true, createdBy: true }),

    connectGroup: z.object({
        masterId: z.number().int().positive(),
        groupId: z.number().int().positive()
    }),

    delete: z.object({ id: z.number().int().positive() }),
    remove: z.object({
        id: z.number().int().positive(),
        deletedAt: z.date().default(new Date()),
        deletedBy: z.string(),
    }),

};

export namespace AlihStatusMasterContract {
    export type SelectDTO = z.infer<typeof AlihStatusMasterContract.select>;
    export type SelectWithSumDataDTO = z.infer<typeof AlihStatusMasterContract.selectWithSumData>;
    export type SelectWithSumDataByGroupDTO = z.infer<typeof AlihStatusMasterContract.selectWithSumDataByGroup>;
    export type CreateDTO = z.infer<typeof AlihStatusMasterContract.create>;
    export type InsertDTO = z.infer<typeof AlihStatusMasterContract.insert>;
    export type EditDTO = z.infer<typeof AlihStatusMasterContract.edit>;
    export type UpdateDTO = z.infer<typeof AlihStatusMasterContract.update>;
    export type ConnectGroupDTO = z.infer<typeof AlihStatusMasterContract.connectGroup>;
    export type DeleteDTO = z.infer<typeof AlihStatusMasterContract.delete>;
    export type RemoveDTO = z.infer<typeof AlihStatusMasterContract.remove>;
}