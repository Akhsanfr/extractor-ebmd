import { PerangkatDaerahContract } from "@/action/perangkatDaerah/perangkatDaerah.contract";
import { BmdAssetType } from "@/enum/bmd";
import z from "zod";
import { BaseCreateSyncJob } from "./base.contract";



export const SyncEbmdContract = {
    create: BaseCreateSyncJob.extend({
        jobType: z.literal("ebmd"),
        lokasi: z.array(PerangkatDaerahContract.lokasi),
        assetType: z.array(z.enum(BmdAssetType))
        // item: z.array(z.object({
        //     lokasi: PerangkatDaerahContract.lokasi,
        //     assetType: BmdAssetType
        // }))
    }),
    payload: z.object({
        lokasi: PerangkatDaerahContract.lokasi,
        assetType: z.enum(BmdAssetType)
    })
}

export namespace SyncEbmdContract {
    export type CreateDTO = z.infer<typeof SyncEbmdContract.create>;
}