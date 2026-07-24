import { asc, eq, gt, inArray } from "drizzle-orm";
import { db } from "@/drizzle";
import { kodePersediaan } from "@/drizzle/schema/kodePersediaan";
import { kodePersediaanEmbedding } from "@/drizzle/schema/kodePersediaanEmbedding";
import { DbOrTx } from "@/action/baseDbOrTx";

export type HashRebuildRow = {
    id: number;
    kategori: string | null;
    nama108: string;
    namaBarang: string;
    satuan: string;
    keywords: string | null;
    contentHash: string | null;
};

/** Ambil batch kodePersediaan pakai keyset pagination (id > cursor), urut by id. */
export async function findKodePersediaanBatchForHash(
    tx: typeof db,
    params: { cursor: number; limit: number },
): Promise<HashRebuildRow[]> {
    return tx
        .select({
            id: kodePersediaan.id,
            kategori: kodePersediaan.kategori,
            nama108: kodePersediaan.nama108,
            namaBarang: kodePersediaan.namaBarang,
            satuan: kodePersediaan.satuan,
            keywords: kodePersediaan.keywords,
            contentHash: kodePersediaan.contentHash,
        })
        .from(kodePersediaan)
        .where(gt(kodePersediaan.id, params.cursor))
        .orderBy(asc(kodePersediaan.id))
        .limit(params.limit);
}

/** Update contentHash utk baris yang berubah, sekaligus requeue embedding-nya ke 'pending'. */
export async function applyHashRebuildBatch(
    tx: DbOrTx,
    updates: { id: number; contentHash: string }[],
): Promise<void> {
    if (updates.length === 0) return;

    // Cukup update contentHash. TIDAK perlu sentuh kodePersediaanEmbedding —
    // claimEmbeddingBatch sudah otomatis re-pick baris "completed" yang
    // embeddingHash != contentHash (lihat kondisi OR kedua di query-nya).
    for (const u of updates) {
        await tx
            .update(kodePersediaan)
            .set({ contentHash: u.contentHash })
            .where(eq(kodePersediaan.id, u.id));
    }
}