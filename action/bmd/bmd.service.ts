import { db } from "@/drizzle";
import { bmdRepository, InsertBmd } from "./bmd.repository";

export const bmdService = {
  bulkUpsertBmd: async (kodeLokasi: string) => {
    try {
      const dataFromEBMD = await bmdRepository.extractFromEBMD("01.00.00")
      const result = await bmdRepository.bulkUpsert(db, dataFromEBMD);
      return result;
    } catch (error: any) {
      throw new Error(`Gagal melakukan sinkronisasi data. ${error.message}`)
    }
  },
};