import { z } from "zod";
import { createSelectSchema } from "drizzle-zod";
import { bmdSyncTable } from "@/drizzle/schema/bmdSync";
import { bmdAssetTypeEnum, bmdSyncStatusEnum } from "@/drizzle/schema";

const selectSchema = createSelectSchema(bmdSyncTable).extend({
    status: z.enum(bmdSyncStatusEnum.enumValues),
});

const createSchema = z.object({
    items: z
        .array(
            z.object({
                perangkatDaerahKodeLokasi: z.string().min(1, "Perangkat daerah wajib dipilih"),
                assetTypes: z
                    .array(z.enum(bmdAssetTypeEnum.enumValues))
                    .min(1, "Pilih minimal satu jenis aset"),
            }),
        )
        .min(1, "Pilih minimal satu perangkat daerah"),
});

const idSchema = z.object({
    id: z.number().int().positive(),
});

export const BmdSyncContract = {
    select: selectSchema,
    create: createSchema,
    control: idSchema,
};

export namespace BmdSyncContract {
    export type SelectDTO = z.infer<typeof BmdSyncContract.select>;
    export type CreateDTO = z.infer<typeof BmdSyncContract.create>;
    export type ControlDTO = z.infer<typeof BmdSyncContract.control>;
}