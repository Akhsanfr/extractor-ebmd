import "server-only";

import { and, eq, isNull, sql } from "drizzle-orm";
import { db } from "@/drizzle";
import { FindMatchKodePersediaanContract } from "./findMatchKodePersediaan.contract";
import { kodePersediaan, kodePersediaanEmbedding } from "@/drizzle/schema";

export const FindMatchKodePersediaanRepository = {
  /**
   * Cari kandidat kode_persediaan paling mirip dengan embedding query,
   * hanya dari embedding yang statusnya sudah "completed" dan
   * kode_persediaan yang belum soft-delete.
   *
   * Catatan performa: untuk data besar, buat index HNSW di kolom embedding:
   *   CREATE INDEX ON kode_persediaan_embedding
   *     USING hnsw (embedding vector_cosine_ops);
   */
  async findSimilarByEmbedding(
    embedding: number[],
    limit: number
  ): Promise<FindMatchKodePersediaanContract.CandidateDTO> {

    const vectorLiteral = `[${embedding.join(",")}]`;

    const similarity = sql<number>`
  1 - (${kodePersediaanEmbedding.embedding} <=> ${vectorLiteral}::vector)
`;

    const result = await db
      .select({
        id: kodePersediaan.id,
        kategori: kodePersediaan.kategori,
        kode108: kodePersediaan.kode108,
        nama108: kodePersediaan.nama108,
        kodeNusp: kodePersediaan.kodeNusp,
        namaBarang: kodePersediaan.namaBarang,
        satuan: kodePersediaan.satuan,
        similarity,
      })
      .from(kodePersediaanEmbedding)
      .innerJoin(
        kodePersediaan,
        eq(kodePersediaan.id, kodePersediaanEmbedding.kodePersediaanId)
      )
      .where(
        and(
          eq(kodePersediaanEmbedding.isSearchReady, true),
          isNull(kodePersediaan.deletedAt)
        )
      )
      .orderBy(sql`${kodePersediaanEmbedding.embedding} <=> ${vectorLiteral}::vector`)
      .limit(limit);

    return result
  }
}