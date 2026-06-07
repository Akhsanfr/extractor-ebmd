import { eq } from "drizzle-orm";
import type { InferInsertModel, InferSelectModel } from "drizzle-orm";
import type { PostgresJsDatabase } from "drizzle-orm/postgres-js";
import type { PgTransaction } from "drizzle-orm/pg-core";
import { rkbmdBaTable } from "@/drizzle/schema"; import { DbOrTx } from "../baseDbOrTx";
;

type SelectRkbmdBa = InferSelectModel<typeof rkbmdBaTable>;
type InsertRkbmdBa = InferInsertModel<typeof rkbmdBaTable>;

export async function findAllRkbmdBa(
  dbOrTx: DbOrTx
): Promise<SelectRkbmdBa[]> {
  return dbOrTx
    .select()
    .from(rkbmdBaTable)
    .orderBy(rkbmdBaTable.perangkatDaerahId);
}

export async function findRkbmdBaByPerangkatDaerahId(
  dbOrTx: DbOrTx,
  perangkatDaerahId: string
): Promise<SelectRkbmdBa | undefined> {
  const [row] = await dbOrTx
    .select()
    .from(rkbmdBaTable)
    .where(eq(rkbmdBaTable.perangkatDaerahId, perangkatDaerahId));
  return row;
}

export async function upsertRkbmdBa(
  dbOrTx: DbOrTx,
  data: InsertRkbmdBa
): Promise<SelectRkbmdBa> {
  const [row] = await dbOrTx
    .insert(rkbmdBaTable)
    .values(data)
    .onConflictDoUpdate({
      target: rkbmdBaTable.perangkatDaerahId,
      set: {
        pengantar: data.pengantar,
        pengadaan: data.pengadaan,
        pemeliharaan: data.pemeliharaan,
        namaPeserta: data.namaPeserta,
        nipPeserta: data.nipPeserta,
        updatedBy: data.updatedBy,
        updatedAt: new Date(),
      },
    })
    .returning();
  return row;
}