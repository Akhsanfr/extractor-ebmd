import { bmd } from "@/drizzle/schema/bmd";
import { sql } from "drizzle-orm";

type DbOrTx = any;
export type InsertBmd = typeof bmd.$inferInsert;
export type SelectBmd = typeof bmd.$inferSelect;

export const bmdRepository = {
  bulkUpsert: async (dbOrTx: DbOrTx, data: InsertBmd[]): Promise<SelectBmd[]> => {
    // Jika data kosong, pulangkan array kosong untuk elak ralat query
    if (data.length === 0) return [];

    const result = await dbOrTx
      .insert(bmd)
      .values(data)
      .onConflictDoUpdate({
        target: bmd.nibar,
        set: {
          // WAJIB guna EXCLUDED untuk bulk upsert agar ia merujuk ke data row yang sedang diproses oleh pangkalan data
          nomorRegister: sql`EXCLUDED.nomor_register`,
          kodeBarang: sql`EXCLUDED.kode_barang`,
          namaBarang: sql`EXCLUDED.nama_barang`,
          spesifikasiNamaBarang: sql`EXCLUDED.spesifikasi_nama_barang`,
          spesifikasiLainnya: sql`EXCLUDED.spesifikasi_lainnya`,
          jumlah: sql`EXCLUDED.jumlah`,
          satuan: sql`EXCLUDED.satuan`,
          lokasi: sql`EXCLUDED.lokasi`,
          perangkatDaerahId: sql`EXCLUDED.perangkat_daerah_id`,
        },
      })
      .returning();

    return result;
  },
};