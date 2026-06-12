import { bmdRepository, InsertBmd } from "./bmd.repository";
import { BmdContract } from "./bmd.contract";

type DbOrTx = any; // Sesuaikan import dengan aplikasi Anda

export const bmdService = {
  bulkUpsertBmd: async (dbOrTx: DbOrTx, data: BmdContract.BulkUpsertDTO) => {

    // 1. Mapping DTO Array -> Database Type Array
    const insertData: InsertBmd[] = data.map((item) => ({
      ...item,
      jumlah: String(item.jumlah), // Pastikan setiap item format jumlahnya sah
    }));

    // 2. Orkestrasi Repository (Bulk Upsert Operation)
    const result = await bmdRepository.bulkUpsert(dbOrTx, insertData);

    // 3. Return ke action
    return result;
  },
};