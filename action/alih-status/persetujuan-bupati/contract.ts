import { alihStatusPersetujuanBupatiTable } from "@/drizzle/schema";
import { AlihStatusType } from "@/enum/alihStatus";
import { createInsertSchema, createSelectSchema } from "drizzle-zod";
import { z } from "zod";
import { AlihStatusDataContract } from "../data/contract";
import { AlihStatusBAPenelitianContract } from "../ba-penelitian/contract";
import { AlihStatusPermohonanContract } from "../permohonan/contract";
import { AlihStatusNodinContract } from "../nodin/contract";

export const AlihStatusPersetujuanBupatiContract = {
    select: createSelectSchema(alihStatusPersetujuanBupatiTable).extend({ alihStatusType: z.enum(AlihStatusType) }),

    selectWithDetail: z.object({
        persetujuanBupati: createSelectSchema(alihStatusPersetujuanBupatiTable).extend({ alihStatusType: z.enum(AlihStatusType) }),
        nodin: AlihStatusNodinContract.select.array(),
        data: AlihStatusDataContract.select.array(),
        BAPenelitian: AlihStatusBAPenelitianContract.select.array(),
        permohonan: AlihStatusPermohonanContract.select.array()
    }),


    create: createInsertSchema(alihStatusPersetujuanBupatiTable).extend({
        alihStatusType: z.enum(AlihStatusType),
        dataIds: z.number().array(),
    })
        .omit({ createdAt: true, createdBy: true }),
    import: createInsertSchema(alihStatusPersetujuanBupatiTable)
        .extend({
            alihStatusType: z.enum(AlihStatusType),
        })
        .omit({ createdAt: true, createdBy: true })
        .array(),

    insert: createInsertSchema(alihStatusPersetujuanBupatiTable).extend({
        alihStatusType: z.enum(AlihStatusType),
    }),

    edit: createInsertSchema(alihStatusPersetujuanBupatiTable)
        .extend({ id: z.number().int().positive(), alihStatusType: z.enum(AlihStatusType) })
        .omit({ createdAt: true, createdBy: true }),
    update: createInsertSchema(alihStatusPersetujuanBupatiTable)
        .extend({ id: z.number().int().positive(), createdBy: z.string(), updatedAt: z.date(), updatedBy: z.string(), alihStatusType: z.enum(AlihStatusType) })
        .omit({ createdAt: true, createdBy: true }),

    delete: z.object({ id: z.number().int().positive() }),
};

export namespace AlihStatusPersetujuanBupatiContract {
    export type SelectDTO = z.infer<typeof AlihStatusPersetujuanBupatiContract.select>;
    export type SelectWithDetailDTO = z.infer<typeof AlihStatusPersetujuanBupatiContract.selectWithDetail>;
    export type CreateDTO = z.infer<typeof AlihStatusPersetujuanBupatiContract.create>;
    export type InsertDTO = z.infer<typeof AlihStatusPersetujuanBupatiContract.insert>;
    export type EditDTO = z.infer<typeof AlihStatusPersetujuanBupatiContract.edit>;
    export type UpdateDTO = z.infer<typeof AlihStatusPersetujuanBupatiContract.update>;
    export type DeleteDTO = z.infer<typeof AlihStatusPersetujuanBupatiContract.delete>;
}
