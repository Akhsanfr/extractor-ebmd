import { bmdTable } from "@/drizzle/schema/bmd";
import { sql } from "drizzle-orm";
import { DbOrTx } from "../baseDbOrTx";
import { BmdContract } from "./bmd.contract";

export interface BmdRepositoryContract {
  upsertMany(
    dbOrTx: DbOrTx,
    rows: BmdContract.InsertDTO[],
  ): Promise<void>;
}

export const BmdRepository: BmdRepositoryContract = {
  async upsertMany(dbOrTx, rows) {
    if (rows.length === 0) return;

    await dbOrTx
      .insert(bmdTable)
      .values(rows)
      .onConflictDoUpdate({
        target: bmdTable.nibar,
        set: {
          nomorRegister: sql`excluded.nomor_register`,
          kodeBarang: sql`excluded.kode_barang`,
          namaBarang: sql`excluded.nama_barang`,
          spesifikasiNamaBarang: sql`excluded.spesifikasi_nama_barang`,
          spesifikasiLainnya: sql`excluded.spesifikasi_lainnya`,
          jumlah: sql`excluded.jumlah`,
          satuan: sql`excluded.satuan`,
          lokasi: sql`excluded.lokasi`,
          perangkatDaerahKodeLokasi: sql`excluded.perangkat_daerah_id`,
          lastSyncAt: new Date(),
          updatedAt: new Date(),
        },
      });
  },
};