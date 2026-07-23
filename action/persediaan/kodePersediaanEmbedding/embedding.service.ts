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
import { generateEmbedding, generateEmbeddingBatch } from "../ollama/ollama.service";

const BATCH_SIZE = 10;
const POLL_INTERVAL_MS = 3000;
const EMBEDDING_MODEL = "bge-m3";

async function claimAndMarkProcessing(): Promise<EmbeddingJob[]> {
    return db.transaction(async (tx) => {
        const jobs = await claimEmbeddingBatch(tx, BATCH_SIZE);
        for (const job of jobs) {
            await markProcessing(tx, job.kodePersediaanId);
        }
        return jobs;
    });
}

/** Tandai satu job selesai/gagal — dipisah biar dipakai di jalur batch maupun fallback. */
async function finalizeJob(job: EmbeddingJob, embedding: number[] | null, error?: string) {
    if (embedding) {
        await markCompleted(db, {
            kodePersediaanId: job.kodePersediaanId,
            embedding,
            embeddingHash: job.contentHash,
            model: EMBEDDING_MODEL,
        });
        console.log(`✅ [${job.kodePersediaanId}] embedding selesai`);
    } else {
        await markFailed(db, {
            kodePersediaanId: job.kodePersediaanId,
            lastError: error ?? "Unknown error",
        });
        console.error(`❌ [${job.kodePersediaanId}] gagal embed:`, error);
    }
}

/** Fallback: proses satu-satu ketika batch call gagal total, supaya item bermasalah bisa diisolasi. */
async function processJobsIndividually(jobs: EmbeddingJob[]) {
    for (const job of jobs) {
        try {
            const embedding = await generateEmbedding({
                kategori: job.kategori,
                namaBarang: job.namaBarang,
                satuan: job.satuan,
            });
            await finalizeJob(job, embedding);
        } catch (err: any) {
            await finalizeJob(job, null, err?.message);
        }
    }
}

async function processBatch(): Promise<number> {
    const jobs = await claimAndMarkProcessing();
    if (jobs.length === 0) return 0;

    try {
        const embeddings = await generateEmbeddingBatch(
            jobs.map((job) => ({
                kategori: job.kategori,
                namaBarang: job.namaBarang,
                satuan: job.satuan,
            }))
        );
        await Promise.all(jobs.map((job, i) => finalizeJob(job, embeddings[i])));
    } catch (err: any) {
        // Batch gagal total (misal timeout jaringan) — coba isolasi per item.
        console.error("⚠️ Batch embedding gagal, fallback ke per-item:", err?.message);
        await processJobsIndividually(jobs);
    }

    return jobs.length;
}

export async function runEmbeddingWorkerOnce() {
    await recoverStuckProcessing(db);
    return processBatch();
}

export async function startEmbeddingWorker() {
    console.log("🚀 Embedding worker started");
    let tick = 0;

    while (true) {
        try {
            if (tick % 10 === 0) {
                await recoverStuckProcessing(db);
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

export async function backfillMissingEmbeddingRows() {
    let totalInserted = 0;
    console.log("🚀 Mulai backfill embedding rows untuk proposal existing...");

    while (true) {
        const missing = await findKodePersediaanWithoutEmbeddingRow(db, { limit: BACKFILL_BATCH_SIZE });
        if (missing.length === 0) break;

        await insertPendingEmbeddingBatch(db, missing.map((p) => p.id));
        totalInserted += missing.length;
        console.log(`📦 Batch: ${missing.length} baris pending ditambahkan (total: ${totalInserted})`);
    }

    console.log(`🏁 Backfill selesai. Total ${totalInserted} proposal baru masuk antrian embedding.`);
    return { totalInserted };
}