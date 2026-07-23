import { and, eq, inArray, isNull, lt, ne, or, sql } from "drizzle-orm";
import { DbOrTx } from "../../baseDbOrTx";
import { EmbeddingContract } from "./embedding.contract";
import { kodePersediaan } from "@/drizzle/schema/kodePersediaan";
import { kodePersediaanEmbedding } from "@/drizzle/schema/kodePersediaanEmbedding";

const ACTIVE_MODEL = "bge-m3";
const MAX_RETRY = 5;
const STUCK_PROCESSING_MINUTES = 5;

export type EmbeddingJob = {
    kodePersediaanId: number;
    nama108: string;
    kategori: string;
    namaBarang: string;
    satuan: string;
    contentHash: string;
    retryCount: number;
};

/**
 * Ambil batch job yang perlu diproses worker, sesuai kondisi di MD:
 * - status pending/failed (dan belum melewati batas retry)
 * - embedding_hash != content_hash (proposal berubah setelah completed)
 * - model tersimpan != model aktif
 *
 * FOR UPDATE SKIP LOCKED -> aman untuk multi-worker berjalan bersamaan.
 * WAJIB dipanggil di dalam db.transaction().
 */
export async function claimEmbeddingBatch(
    tx: DbOrTx,
    limit: number
): Promise<EmbeddingJob[]> {
    return tx
        .select({
            kodePersediaanId: kodePersediaanEmbedding.kodePersediaanId,
            kategori: kodePersediaan.kategori,
            nama108: kodePersediaan.nama108,
            namaBarang: kodePersediaan.namaBarang,
            satuan: kodePersediaan.satuan,
            contentHash: kodePersediaan.contentHash,
            retryCount: kodePersediaanEmbedding.retryCount,
        })
        .from(kodePersediaanEmbedding)
        .innerJoin(kodePersediaan, eq(kodePersediaan.id, kodePersediaanEmbedding.kodePersediaanId))
        .where(
            and(
                isNull(kodePersediaan.deletedAt),
                or(
                    and(
                        inArray(kodePersediaanEmbedding.status, ["pending", "failed"]),
                        lt(kodePersediaanEmbedding.retryCount, MAX_RETRY)
                    ),
                    and(
                        eq(kodePersediaanEmbedding.status, "completed"),
                        ne(
                            sql`coalesce(${kodePersediaanEmbedding.embeddingHash}, '')`,
                            sql`coalesce(${kodePersediaan.contentHash}, '')`
                        )
                    ),
                    and(
                        eq(kodePersediaanEmbedding.status, "completed"),
                        ne(sql`coalesce(${kodePersediaanEmbedding.model}, '')`, ACTIVE_MODEL)
                    )
                )
            )
        )
        .orderBy(kodePersediaanEmbedding.updatedAt)
        .limit(limit)
        .for("update", { of: kodePersediaanEmbedding, skipLocked: true }) as unknown as Promise<EmbeddingJob[]>;
}

export async function markProcessing(tx: DbOrTx, kodePersediaanId: number) {
    await tx
        .update(kodePersediaanEmbedding)
        .set({ status: "processing", startedAt: new Date(), updatedAt: new Date() })
        .where(eq(kodePersediaanEmbedding.kodePersediaanId, kodePersediaanId));
}

export async function markCompleted(
    dbOrTx: DbOrTx,
    params: {
        kodePersediaanId: number;
        embedding: number[];
        embeddingHash: string;
        model: string;
    }
) {
    await dbOrTx
        .update(kodePersediaanEmbedding)
        .set({
            embedding: params.embedding,
            embeddingHash: params.embeddingHash,
            model: params.model,
            status: "completed",
            completedAt: new Date(),
            updatedAt: new Date(),
            retryCount: 0,
            lastError: null,
        })
        .where(eq(kodePersediaanEmbedding.kodePersediaanId, params.kodePersediaanId));
}

export async function markFailed(
    dbOrTx: DbOrTx,
    params: { kodePersediaanId: number; lastError: string }
) {
    await dbOrTx
        .update(kodePersediaanEmbedding)
        .set({
            status: "failed",
            lastError: params.lastError,
            retryCount: sql`${kodePersediaanEmbedding.retryCount} + 1`,
            updatedAt: new Date(),
        })
        .where(eq(kodePersediaanEmbedding.kodePersediaanId, params.kodePersediaanId));
}

/**
 * Crash recovery — proposal yang "processing" terlalu lama
 * (worker mati di tengah jalan) dikembalikan ke pending.
 */
export async function recoverStuckProcessing(dbOrTx: DbOrTx) {
    const threshold = new Date(Date.now() - STUCK_PROCESSING_MINUTES * 60_000);
    await dbOrTx
        .update(kodePersediaanEmbedding)
        .set({ status: "pending", updatedAt: new Date() })
        .where(
            and(
                eq(kodePersediaanEmbedding.status, "processing"),
                lt(kodePersediaanEmbedding.startedAt, threshold)
            )
        );
}

/**
 * Dipanggil dari proposal.service saat CREATE proposal baru.
 */
export async function insertPendingEmbedding(tx: DbOrTx, kodePersediaanId: number) {
    await tx.insert(kodePersediaanEmbedding).values({
        kodePersediaanId,
        status: "pending",
    });
}

/**
 * Dipanggil dari proposal.service saat UPDATE proposal,
 * HANYA kalau content_hash berubah. Tidak menyentuh embedding
 * yang sudah ada — biar tetap dipakai sampai worker selesai re-embed.
 */
export async function markEmbeddingPending(tx: DbOrTx, kodePersediaanId: number) {
    await tx
        .update(kodePersediaanEmbedding)
        .set({ status: "pending", updatedAt: new Date() })
        .where(eq(kodePersediaanEmbedding.kodePersediaanId, kodePersediaanId));
}

export async function getEmbeddingBykodePersediaanId(
    dbOrTx: DbOrTx,
    kodePersediaanId: number,
): Promise<EmbeddingContract.SelectForSimilarityDTO | null> {
    const [row] = await dbOrTx
        .select({
            kodePersediaanId: kodePersediaanEmbedding.kodePersediaanId,
            embedding: kodePersediaanEmbedding.embedding,
            status: kodePersediaanEmbedding.status,
        })
        .from(kodePersediaanEmbedding)
        .where(eq(kodePersediaanEmbedding.kodePersediaanId, kodePersediaanId))
        .limit(1);

    return row ?? null;
}

/**
 * Cari proposal yang BELUM punya baris di kodePersediaanEmbedding sama sekali.
 * Dipakai untuk backfill data existing (proposal yang dibuat sebelum
 * tabel embedding ada, atau kalau ada proposal yang somehow ke-skip
 * saat createProposal).
 */
export async function findKodePersediaanWithoutEmbeddingRow(
    dbOrTx: DbOrTx,
    params: { limit: number },
): Promise<{ id: number }[]> {
    return dbOrTx
        .select({ id: kodePersediaan.id })
        .from(kodePersediaan)
        .leftJoin(
            kodePersediaanEmbedding,
            eq(kodePersediaanEmbedding.kodePersediaanId, kodePersediaan.id),
        )
        .where(
            and(
                isNull(kodePersediaan.deletedAt),
                isNull(kodePersediaanEmbedding.kodePersediaanId), // belum ada baris embedding
            ),
        )
        .orderBy(kodePersediaan.id)
        .limit(params.limit);
}

/**
 * Insert banyak baris pending sekaligus (dipanggil oleh backfill script).
 * onConflictDoNothing jaga-jaga kalau ada race dengan createProposal.
 */
export async function insertPendingEmbeddingBatch(
    dbOrTx: DbOrTx,
    kodePersediaanIds: number[],
) {
    if (kodePersediaanIds.length === 0) return;

    await dbOrTx
        .insert(kodePersediaanEmbedding)
        .values(kodePersediaanIds.map((kodePersediaanId) => ({ kodePersediaanId, status: "pending" as const })))
        .onConflictDoNothing({ target: kodePersediaanEmbedding.kodePersediaanId });
}