// app/action/embedding/embedding.service.ts
import { db } from "@/drizzle";
import {
    claimEmbeddingBatch,
    markProcessing,
    markCompleted,
    markFailed,
    recoverStuckProcessing,
    EmbeddingJob,
    findKodePersediaanWithoutEmbeddingRow,
    insertPendingEmbeddingBatch,
} from "./embedding.repository";
import { generateEmbedding } from "../ollama/ollama.service";

const BATCH_SIZE = 10;
const POLL_INTERVAL_MS = 3000;
const EMBEDDING_MODEL = "bge-m3";

/**
 * Claim + tandai processing dalam SATU transaksi pendek (lock dilepas
 * begitu commit). Panggilan Ollama (bisa sampai 60 detik) TIDAK boleh
 * berada di dalam transaksi ini, supaya tidak menahan row lock lama.
 */
async function claimAndMarkProcessing(): Promise<EmbeddingJob[]> {
    return db.transaction(async (tx) => {
        const jobs = await claimEmbeddingBatch(tx, BATCH_SIZE);
        for (const job of jobs) {
            await markProcessing(tx, job.kodePersediaanId);
        }
        return jobs;
    });
}

async function processJob(job: EmbeddingJob) {
    try {
        const embedding = await generateEmbedding({
            kategori: job.kategori,
            namaBarang: job.namaBarang,
            satuan: job.satuan,
        });

        await markCompleted(db, {
            kodePersediaanId: job.kodePersediaanId,
            embedding,
            embeddingHash: job.contentHash, // content_hash sudah dihitung saat create/update
            model: EMBEDDING_MODEL,
        });

        console.log(`✅ [${job.kodePersediaanId}] embedding selesai`);
    } catch (err: any) {
        await markFailed(db, {
            kodePersediaanId: job.kodePersediaanId,
            lastError: err?.message ?? "Unknown error",
        });
        console.error(`❌ [${job.kodePersediaanId}] gagal embed:`, err?.message);
    }
}

async function processBatch(): Promise<number> {
    const jobs = await claimAndMarkProcessing();
    if (jobs.length === 0) return 0;

    await Promise.all(jobs.map(processJob));
    return jobs.length;
}

/** Sekali jalan — berguna untuk testing/manual trigger. */
export async function runEmbeddingWorkerOnce() {
    await recoverStuckProcessing(db);
    return processBatch();
}

/**
 * Worker loop — dijalankan sebagai PROSES TERPISAH via PM2, BUKAN dari
 * request Next.js. Lihat scripts/embedding-worker.ts sebagai entrypoint.
 */
export async function startEmbeddingWorker() {
    console.log("🚀 Embedding worker started");
    let tick = 0;

    while (true) {
        try {
            if (tick % 10 === 0) {
                await recoverStuckProcessing(db); // ~tiap 30 detik
            }
            const processed = await processBatch();
            if (processed > 0) console.log(`📦 Processed ${processed} job(s)`);
        } catch (err) {
            console.error("❌ Worker loop error:", err);
        }
        tick++;
        await new Promise((r) => setTimeout(r, POLL_INTERVAL_MS));
    }
}

const BACKFILL_BATCH_SIZE = 500;

/**
 * BACKFILL — jalan sekali (manual trigger), bukan bagian dari worker loop.
 * Tujuannya cuma memastikan SETIAP proposal punya baris di
 * shsProposalEmbedding dengan status 'pending'. Proses embedding-nya
 * sendiri tetap ditangani worker yang sudah berjalan terus-menerus.
 *
 * Aman untuk di-rerun berkali-kali (idempotent) — proposal yang sudah
 * punya baris otomatis tidak akan muncul lagi di query berikutnya.
 */
export async function backfillMissingEmbeddingRows() {
    let totalInserted = 0;

    console.log("🚀 Mulai backfill embedding rows untuk proposal existing...");

    while (true) {
        const missing = await findKodePersediaanWithoutEmbeddingRow(db, {
            limit: BACKFILL_BATCH_SIZE,
        });

        if (missing.length === 0) break;

        await insertPendingEmbeddingBatch(
            db,
            missing.map((p) => p.id),
        );

        totalInserted += missing.length;
        console.log(`📦 Batch: ${missing.length} baris pending ditambahkan (total: ${totalInserted})`);
    }

    console.log(`🏁 Backfill selesai. Total ${totalInserted} proposal baru masuk antrian embedding.`);
    return { totalInserted };
}