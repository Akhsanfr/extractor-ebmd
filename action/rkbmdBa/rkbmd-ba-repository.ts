import { eq, getColumns } from "drizzle-orm";
import { perangkatDaerahTable, rkbmdBaTable } from "@/drizzle/schema"; import { DbOrTx } from "../baseDbOrTx";
import { RkbmdBaContract } from "./rkbmd-ba-contract";
;

export async function findAllRkbmdBa(
  dbOrTx: DbOrTx
): Promise<RkbmdBaContract.SelectDTO[]> {
  return dbOrTx
    .select({ ...getColumns(rkbmdBaTable), perangkatDaerah: getColumns(perangkatDaerahTable).namaLokasi })
    .from(rkbmdBaTable).innerJoin(perangkatDaerahTable, eq(rkbmdBaTable.perangkatDaerahId, perangkatDaerahTable.kodeLokasi))
    .orderBy(rkbmdBaTable.perangkatDaerahId);
}

export async function findRkbmdBaByPerangkatDaerahId(
  dbOrTx: DbOrTx,
  perangkatDaerahId: string
): Promise<RkbmdBaContract.SelectDTO> {
  const [row] = await dbOrTx
    .select({ ...getColumns(rkbmdBaTable), perangkatDaerah: getColumns(perangkatDaerahTable).namaLokasi })
    .from(rkbmdBaTable)
    .where(eq(rkbmdBaTable.perangkatDaerahId, perangkatDaerahId));
  if (!row) throw new Error("Data tidak ditemukan");
  return row;
}

export async function upsertRkbmdBa(
  dbOrTx: DbOrTx,
  data: RkbmdBaContract.InsertDTO
): Promise<void> {
  await dbOrTx
    .insert(rkbmdBaTable)
    .values(data)
    .onConflictDoUpdate({
      target: rkbmdBaTable.perangkatDaerahId,
      set: {
        pengantarNomor: data.pengantarNomor,
        pengantarTanggal: data.pengantarTanggal,
        pengantar: data.pengantar,
        pengadaan: data.pengadaan,
        pemeliharaan: data.pemeliharaan,
        namaPeserta: data.namaPeserta,
        nipPeserta: data.nipPeserta,
        jabatanPeserta: data.jabatanPeserta,
        tanggalPerbaikan: data.tanggalPerbaikan,
        updatedBy: data.updatedBy,
        updatedAt: new Date(),
      },
    })
}