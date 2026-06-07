import { eq } from "drizzle-orm";
import type { InferInsertModel, InferSelectModel } from "drizzle-orm";
import { perangkatDaerahTable } from "@/drizzle/schema/perangkatDaerah";
import { DbOrTx } from "../baseDbOrTx";

type SelectPerangkatDaerah = InferSelectModel<typeof perangkatDaerahTable>;
type InsertPerangkatDaerah = InferInsertModel<typeof perangkatDaerahTable>;

export async function findAllPerangkatDaerah(
  dbOrTx: DbOrTx
): Promise<SelectPerangkatDaerah[]> {
  return dbOrTx
    .select()
    .from(perangkatDaerahTable)
    .orderBy(perangkatDaerahTable.kodeLokasi);
}

export async function findPerangkatDaerahByKodeLokasi(
  dbOrTx: DbOrTx,
  kodeLokasi: string
): Promise<SelectPerangkatDaerah | undefined> {
  const [row] = await dbOrTx
    .select()
    .from(perangkatDaerahTable)
    .where(eq(perangkatDaerahTable.kodeLokasi, kodeLokasi));

  return row;
}

export async function upsertPerangkatDaerah(
  dbOrTx: DbOrTx,
  data: InsertPerangkatDaerah
): Promise<SelectPerangkatDaerah> {
  const [row] = await dbOrTx
    .insert(perangkatDaerahTable)
    .values(data)
    .onConflictDoUpdate({
      target: perangkatDaerahTable.kodeLokasi,
      set: {
        namaLokasi: data.namaLokasi,
        jabatan: data.jabatan,
        updatedBy: data.updatedBy,
        updatedAt: new Date(),
      },
    })
    .returning();

  return row;
}

export async function upsertManyPerangkatDaerah(
  dbOrTx: DbOrTx,
  data: InsertPerangkatDaerah[]
): Promise<void> {
  if (data.length === 0) return;

  await dbOrTx
    .insert(perangkatDaerahTable)
    .values(data)
    .onConflictDoUpdate({
      target: perangkatDaerahTable.kodeLokasi,
      set: {
        namaLokasi: perangkatDaerahTable.namaLokasi,
        jabatan: perangkatDaerahTable.jabatan,
        updatedAt: new Date(),
      },
    });
}