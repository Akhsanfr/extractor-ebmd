import { db } from "@/drizzle";
import { BmdContract } from "@/action/bmd/bmd.contract";
import { BmdRepository } from "@/action/bmd/bmd.repository";
import { BmdAssetType } from "@/enum/bmd";
import { SyncJobType } from "@/enum/sync";

import {
    BatchContext,
    BatchWorkerHandlers,
    executeBatchWorker,
    executeListWorker,
    ListContext,
    ListWorkerHandlers,
    PrepareListResult,
} from "../worker";
import { EbmdStorage, type EbmdResource } from "./ebmdSync.storage";
import { EbmdUtil } from "./ebmdSync.util";
import { ebmdSyncRepository } from "./ebmdSync.repository";

/**
 * =============================================================================
 * eBMD Sync Worker
 * =============================================================================
 *
 * Implementasi konkret dari template worker.ts (executeListWorker /
 * executeBatchWorker) untuk sinkronisasi data BMD dari aplikasi eBMD
 * (ebmd.pasuruankab.go.id) ke database lokal.
 *
 * Sebelumnya ini class `EbmdSyncWorker extends SyncWorker`. Sekarang jadi
 * kumpulan fungsi biasa — tiap step di-export sebagai fungsi lepas,
 * lalu dirangkai jadi `ListWorkerHandlers` / `BatchWorkerHandlers` dan
 * dijalankan lewat `executeListWorker` / `executeBatchWorker`. Alur dan
 * urutan langkahnya TIDAK berubah, hanya bentuknya.
 *
 * List Worker (runEbmdListWorker)
 *   1. Klaim satu SyncList pending (payload: { kodeLokasi, assetType }).
 *   2. Panggil EbmdUtil.extractFromEBMD → download & parse Excel dari eBMD.
 *   3. Simpan HASIL MENTAHNYA ke storage (EbmdStorage), bukan langsung ke DB.
 *      List Worker hanya "menyiapkan pekerjaan", tidak menulis data akhir.
 *   4. Hitung totalBatch dari jumlah baris, lalu buat SyncBatch per 100 baris.
 *
 * Batch Worker (runEbmdBatchWorker)
 *   1. Klaim satu SyncBatch pending.
 *   2. Baca potongan data sesuai batchPage dari storage (EbmdStorage) —
 *      TIDAK memanggil eBMD lagi.
 *   3. Upsert potongan itu ke tabel BMD lewat BmdRepository.
 *
 * Setiap fungsi step dibungkus try-catch dan mencatat error via
 * console.error sebelum melempar ulang (rethrow) — supaya jejak error
 * tetap muncul di log meskipun penanganan akhirnya (failList/failBatch)
 * terjadi satu lapis di atas, di executeListWorker/executeBatchWorker.
 * =============================================================================
 */

const BATCH_SIZE = 100;
const JOB_TYPE = SyncJobType.EBMD;
const MAX_RETRY = 3;

const LOG_TAG = "[EbmdSyncWorker]";

/** Bentuk payload yang wajib ada di SyncList.payload untuk job type ini. */
export type EbmdListPayload = {
    kodeLokasi: string;
    assetType: BmdAssetType;
};

export type SyncBatchInsert = {
    listId: number;
    batchPage: number;
    batchSize: number;
    createdBy: string;
};

/**
 * Port (interface) ke lapisan data untuk tabel sync_job / sync_list /
 * sync_batch. Implementasinya ada di ebmdSync.repository.ts. Dipisah
 * sebagai type di sini supaya repository bisa type-check terhadap
 * kontrak yang sama tanpa saling import balik (circular).
 */
export interface SyncRepository {
    // List Worker
    claimNextList(): Promise<ListContext | null>;
    isAborted(listId: number): Promise<boolean>;
    createBatches(batches: SyncBatchInsert[]): Promise<void>;
    updateListPrepared(
        listId: number,
        data: { totalBatch: number; resource: Record<string, unknown> },
    ): Promise<void>;
    failList(listId: number, error: Error, maxRetry: number): Promise<void>;

    // Batch Worker
    claimNextBatch(): Promise<BatchContext | null>;
    isBatchAborted(batchId: number, listId: number): Promise<boolean>;
    completeBatch(batchId: number): Promise<void>;
    failBatch(batchId: number, error: Error, maxRetry: number): Promise<void>;
    incrementListProgress(listId: number): Promise<{ completed: boolean }>;
    incrementJobProgress(jobId: number): Promise<{ completed: boolean }>;
}

// -------------------------------------------------------------------------
// LIST WORKER — ambil dari API, simpan ke storage, buat batch
// -------------------------------------------------------------------------

async function claimNextList(): Promise<ListContext | null> {
    try {
        return await ebmdSyncRepository.claimNextList();
    } catch (err) {
        console.error(`${LOG_TAG} claimNextList gagal:`, err);
        throw err;
    }
}

async function isListAborted(ctx: ListContext): Promise<boolean> {
    try {
        return await ebmdSyncRepository.isAborted(ctx.list.id);
    } catch (err) {
        console.error(`${LOG_TAG} isListAborted gagal untuk List #${ctx.list.id}:`, err);
        throw err;
    }
}

async function prepareList(ctx: ListContext): Promise<PrepareListResult> {
    const payload = ctx.list.payload as unknown as Partial<EbmdListPayload>;

    if (!payload?.kodeLokasi || !payload?.assetType) {
        const error = new Error(
            `SyncList #${ctx.list.id} payload tidak valid: "kodeLokasi" dan "assetType" wajib diisi.`,
        );
        console.error(`${LOG_TAG} prepareList gagal:`, error);
        throw error;
    }

    // 1. Ambil data dari eBMD (request + parsing Excel ke provider eksternal).
    let rows: BmdContract.InsertDTO[];
    try {
        // rows = await EbmdUtil.extractFromEBMD(payload.kodeLokasi, payload.assetType);
        rows = await EbmdUtil.extractPlaywright(payload.kodeLokasi);
    } catch (err) {
        console.error(
            `${LOG_TAG} extractFromEBMD gagal untuk List #${ctx.list.id} (kodeLokasi=${payload.kodeLokasi}):`,
            err,
        );
        throw err;
    }

    if (rows.length === 0) {
        // Tidak ada data untuk kombinasi kodeLokasi/assetType ini — bukan
        // error, tapi tidak perlu ada batch sama sekali.
        return { totalBatch: 0, resource: { totalRows: 0 } };
    }

    // 2. Simpan hasil mentah ke storage — supaya batch worker tidak perlu
    //    memukul eBMD lagi untuk tiap batch / saat retry.
    let resource: EbmdResource;
    try {
        resource = await EbmdStorage.save(ctx.list.id, rows);
    } catch (err) {
        console.error(`${LOG_TAG} EbmdStorage.save gagal untuk List #${ctx.list.id}:`, err);
        throw err;
    }

    // 3. Hitung jumlah batch.
    const totalBatch = Math.ceil(resource.totalRows / BATCH_SIZE);

    return { totalBatch, resource: resource as unknown as Record<string, unknown> };
}

async function createBatch(ctx: ListContext, prep: PrepareListResult): Promise<void> {
    if (prep.totalBatch === 0) return;

    const batches: SyncBatchInsert[] = Array.from({ length: prep.totalBatch }, (_, i) => ({
        listId: ctx.list.id,
        batchPage: i + 1, // batch dimulai dari halaman ke-1
        batchSize: BATCH_SIZE,
        createdBy: ctx.list.createdBy,
    }));

    try {
        await ebmdSyncRepository.createBatches(batches);
    } catch (err) {
        console.error(`${LOG_TAG} createBatches gagal untuk List #${ctx.list.id}:`, err);
        throw err;
    }
}

async function finishListPreparation(ctx: ListContext, prep: PrepareListResult): Promise<void> {
    try {
        await ebmdSyncRepository.updateListPrepared(ctx.list.id, {
            totalBatch: prep.totalBatch,
            resource: prep.resource,
        });
    } catch (err) {
        console.error(`${LOG_TAG} updateListPrepared gagal untuk List #${ctx.list.id}:`, err);
        throw err;
    }
}

async function failList(ctx: ListContext, error: Error): Promise<void> {
    try {
        await ebmdSyncRepository.failList(ctx.list.id, error, MAX_RETRY);
    } catch (err) {
        // Kegagalan mencatat failList tidak boleh ditelan diam-diam — ini
        // paling krusial buat debugging (List bisa nyangkut di "processing").
        console.error(`${LOG_TAG} GAGAL mencatat failList untuk List #${ctx.list.id}:`, err);
        throw err;
    }
}

// -------------------------------------------------------------------------
// BATCH WORKER — ambil dari storage, simpan ke database
// -------------------------------------------------------------------------

async function claimNextBatch(): Promise<BatchContext | null> {
    try {
        return await ebmdSyncRepository.claimNextBatch();
    } catch (err) {
        console.error(`${LOG_TAG} claimNextBatch gagal:`, err);
        throw err;
    }
}

async function isBatchAborted(ctx: BatchContext): Promise<boolean> {
    try {
        return await ebmdSyncRepository.isBatchAborted(ctx.batch.id, ctx.list.id);
    } catch (err) {
        console.error(`${LOG_TAG} isBatchAborted gagal untuk Batch #${ctx.batch.id}:`, err);
        throw err;
    }
}

async function processBatch(ctx: BatchContext): Promise<void> {
    const resource = ctx.list.resource as unknown as EbmdResource | null;

    if (!resource?.storageKey) {
        const error = new Error(
            `SyncList #${ctx.list.id} belum punya resource hasil prepare — ` +
            `Batch #${ctx.batch.id} tidak bisa diproses.`,
        );
        console.error(`${LOG_TAG} processBatch gagal:`, error);
        throw error;
    }

    // Ambil potongan data sesuai halaman batch ini dari storage
    // (bukan dari eBMD lagi).
    let rows: BmdContract.InsertDTO[];
    try {
        rows = await EbmdStorage.readChunk<BmdContract.InsertDTO>(
            resource.storageKey,
            ctx.batch.batchPage,
            ctx.batch.batchSize,
        );
    } catch (err) {
        console.error(`${LOG_TAG} EbmdStorage.readChunk gagal untuk Batch #${ctx.batch.id}:`, err);
        throw err;
    }

    if (rows.length === 0) return;

    // Simpan ke database. upsert supaya retry batch yang sama (misal
    // setelah gagal di tengah jalan) tidak menghasilkan data duplikat.
    try {
        await BmdRepository.upsertMany(db, rows);
    } catch (err) {
        console.error(`${LOG_TAG} BmdRepository.upsertMany gagal untuk Batch #${ctx.batch.id}:`, err);
        throw err;
    }
}

async function completeBatch(ctx: BatchContext): Promise<void> {
    try {
        await ebmdSyncRepository.completeBatch(ctx.batch.id);
    } catch (err) {
        console.error(`${LOG_TAG} completeBatch gagal untuk Batch #${ctx.batch.id}:`, err);
        throw err;
    }
}

async function updateListProgress(ctx: BatchContext): Promise<void> {
    let completed = false;

    try {
        ({ completed } = await ebmdSyncRepository.incrementListProgress(ctx.list.id));
    } catch (err) {
        console.error(`${LOG_TAG} incrementListProgress gagal untuk List #${ctx.list.id}:`, err);
        throw err;
    }

    if (!completed) return;

    // Opsional: bersihkan file storage karena semua batch untuk list ini
    // sudah selesai diproses. Kegagalan cleanup TIDAK boleh menggagalkan
    // batch yang sudah sukses — cukup dicatat untuk debugging.
    const resource = ctx.list.resource as unknown as EbmdResource | null;
    if (!resource?.storageKey) return;

    try {
        await EbmdStorage.delete(resource.storageKey);
    } catch (err) {
        console.error(`${LOG_TAG} EbmdStorage.delete gagal untuk List #${ctx.list.id} (non-fatal):`, err);
    }
}

async function updateJobProgress(ctx: BatchContext): Promise<void> {
    try {
        await ebmdSyncRepository.incrementJobProgress(ctx.job.id);
    } catch (err) {
        console.error(`${LOG_TAG} incrementJobProgress gagal untuk Job #${ctx.job.id}:`, err);
        throw err;
    }
}

async function failBatch(ctx: BatchContext, error: Error): Promise<void> {
    try {
        await ebmdSyncRepository.failBatch(ctx.batch.id, error, MAX_RETRY);
    } catch (err) {
        console.error(`${LOG_TAG} GAGAL mencatat failBatch untuk Batch #${ctx.batch.id}:`, err);
        throw err;
    }
}

// -------------------------------------------------------------------------
// WIRING — rangkai step-step di atas jadi handlers, lalu jalankan lewat
// template function dari worker.ts.
// -------------------------------------------------------------------------

const listWorkerHandlers: ListWorkerHandlers = {
    claimNextList,
    isListAborted,
    prepareList,
    createBatch,
    finishListPreparation,
    failList,
};

const batchWorkerHandlers: BatchWorkerHandlers = {
    claimNextBatch,
    isBatchAborted,
    processBatch,
    completeBatch,
    updateListProgress,
    updateJobProgress,
    failBatch,
};

/** Jalankan satu siklus List Worker untuk job type eBMD. */
export async function runEbmdListWorker(): Promise<void> {
    await executeListWorker(listWorkerHandlers);
}

/** Jalankan satu siklus Batch Worker untuk job type eBMD. */
export async function runEbmdBatchWorker(): Promise<void> {
    await executeBatchWorker(batchWorkerHandlers);
}

export { JOB_TYPE as EBMD_SYNC_JOB_TYPE };
