/**
 * =============================================================================
 * Sync Worker Workflow
 * =============================================================================
 *
 * Framework sinkronisasi terdiri dari dua jenis worker:
 *
 * 1. List Worker
 *    Bertugas menyiapkan pekerjaan.
 *    - Mengambil SyncList pending
 *    - Menghubungi provider
 *    - Menghitung jumlah batch
 *    - Membuat SyncBatch
 *
 * 2. Batch Worker
 *    Bertugas memproses data.
 *    - Mengambil SyncBatch pending
 *    - Mengambil data provider
 *    - Transform
 *    - Upsert database
 *    - Update progress
 *
 * SyncJob tidak memiliki worker.
 * SyncJob hanya menjadi container dan progress monitoring.
 *
 * Catatan implementasi:
 * Sebelumnya ini berupa abstract class (`SyncWorker`) yang di-extend oleh
 * tiap implementasi konkret (mis. EbmdSyncWorker). Sekarang diubah jadi
 * dua fungsi orkestrator (`executeListWorker` / `executeBatchWorker`) yang
 * menerima "handlers" — object berisi kumpulan fungsi step. Alur & urutan
 * langkahnya SAMA PERSIS seperti sebelumnya, cuma bentuknya bukan class.
 * =============================================================================
 */

import { SyncBatchContract } from "../syncBatch/syncBatch.contract";
import { SyncJobContract } from "../syncJob/syncJob.contract";
import { SyncListContract } from "../syncList/syncList.contract";

/**
 * Konteks yang dibawa sepanjang siklus List Worker.
 * Diteruskan sebagai parameter antar step, BUKAN disimpan sebagai
 * state global — setiap pemanggilan executeListWorker independen, jadi
 * aman dipanggil berkali-kali / concurrent untuk list yang berbeda.
 */
export type ListContext = {
    job: SyncJobContract.SelectDTO;
    list: SyncListContract.SelectDTO;
};

/** Hasil tahap prepare, dipakai untuk createBatch & finishListPreparation. */
export type PrepareListResult = {
    totalBatch: number;
    resource: Record<string, unknown>;
};

/** Konteks yang dibawa sepanjang siklus Batch Worker. */
export type BatchContext = {
    job: SyncJobContract.SelectDTO;
    list: SyncListContract.SelectDTO;
    batch: SyncBatchContract.SelectDTO;
};

/**
 * Kumpulan fungsi yang wajib diisi oleh setiap implementasi List Worker.
 * Ini pengganti "method abstract" dari versi class — setiap implementasi
 * konkret (mis. eBMD) tinggal menyediakan object berisi fungsi-fungsi ini.
 */
export type ListWorkerHandlers = {
    /**
     * Mengambil satu SyncList yang siap diproses dan menandainya
     * `processing` dalam transaction yang sama.
     *
     * Wajib menggunakan transaction dengan:
     *
     * SELECT ...
     * FOR UPDATE SKIP LOCKED
     *
     * agar satu List tidak diambil oleh dua worker, dan query WHERE
     * harus mengecualikan status `aborted`.
     *
     * Return null apabila tidak ada pekerjaan.
     */
    claimNextList: () => Promise<ListContext | null>;

    /**
     * Mengecek apakah SyncList (atau SyncJob induknya) sudah dibatalkan
     * setelah diklaim, sebelum mulai proses prepare yang mahal (network
     * call ke provider).
     */
    isListAborted: (ctx: ListContext) => Promise<boolean>;

    /**
     * Menjalankan proses persiapan provider: autentikasi, download
     * resource, request metadata, menghitung jumlah batch.
     */
    prepareList: (ctx: ListContext) => Promise<PrepareListResult>;

    /**
     * Membuat seluruh SyncBatch berdasarkan hasil prepare.
     * Batch hanya berisi metadata pekerjaan — belum diproses.
     */
    createBatch: (ctx: ListContext, prep: PrepareListResult) => Promise<void>;

    /**
     * Menyelesaikan tahap persiapan: update totalBatch & resource.
     * Status List tetap processing — baru dianggap completed setelah
     * seluruh Batch selesai (lihat updateListProgress di batch worker).
     */
    finishListPreparation: (ctx: ListContext, prep: PrepareListResult) => Promise<void>;

    /**
     * Menangani kegagalan List: update retryCount, lastError, dan status
     * (kembali ke `pending` jika retryCount < maxRetry, `failed` jika habis).
     */
    failList: (ctx: ListContext, error: Error) => Promise<void>;
};

/** Kumpulan fungsi yang wajib diisi oleh setiap implementasi Batch Worker. */
export type BatchWorkerHandlers = {
    /**
     * Mengambil satu Batch menggunakan row locking dan menandainya
     * `processing` dalam transaction yang sama. Query WHERE harus
     * mengecualikan status `aborted`. Return null jika tidak ada
     * Batch pending.
     */
    claimNextBatch: () => Promise<BatchContext | null>;

    /** Mengecek apakah Batch/List/Job sudah dibatalkan setelah diklaim. */
    isBatchAborted: (ctx: BatchContext) => Promise<boolean>;

    /**
     * Memproses satu Batch: fetch provider, parsing, transform, validasi,
     * upsert database. Fungsi ini TIDAK mengubah status parent.
     */
    processBatch: (ctx: BatchContext) => Promise<void>;

    /** Menandai Batch selesai diproses: status = completed, finishedAt. */
    completeBatch: (ctx: BatchContext) => Promise<void>;

    /**
     * Memperbarui progress SyncList (increment completedBatch, dan
     * status = completed jika seluruh Batch selesai). Wajib atomic.
     */
    updateListProgress: (ctx: BatchContext) => Promise<void>;

    /**
     * Memperbarui progress SyncJob (increment completedList, dan
     * status = completed jika seluruh SyncList selesai). Wajib atomic.
     */
    updateJobProgress: (ctx: BatchContext) => Promise<void>;

    /**
     * Menangani kegagalan Batch: update retryCount, lastError. Jika retry
     * habis: status = failed, increment failedBatch pada List (dan
     * failedList pada Job jika seluruh batch List tersebut sudah final).
     */
    failBatch: (ctx: BatchContext, error: Error) => Promise<void>;
};

function toError(err: unknown): Error {
    return err instanceof Error ? err : new Error(String(err));
}

/**
 * Menjalankan satu siklus List Worker.
 *
 * Ini adalah template function — urutan langkah sudah fix di sini,
 * implementasi konkret cukup mengisi tiap step lewat `handlers`.
 *
 * Flow:
 *
 * 1. Claim SyncList berikutnya (sudah menandai processing di dalam transaction).
 * 2. Jalankan proses prepare.
 * 3. Buat seluruh SyncBatch.
 * 4. Simpan metadata hasil prepare & tandai list processing selesai.
 * 5. Selesai. Jika ada error di step manapun, jatuh ke failList.
 *
 * Catatan:
 * Worker ini TIDAK memproses data utama.
 * Tugasnya hanya menyiapkan pekerjaan untuk Batch Worker.
 */
export async function executeListWorker(handlers: ListWorkerHandlers): Promise<void> {
    const ctx = await handlers.claimNextList();
    if (!ctx) return;

    if (await handlers.isListAborted(ctx)) return;

    try {
        const prep = await handlers.prepareList(ctx);
        await handlers.createBatch(ctx, prep);
        await handlers.finishListPreparation(ctx, prep);
    } catch (err) {
        const error = toError(err);
        console.error(`[SyncWorker] List #${ctx.list.id} (Job #${ctx.job.id}) gagal diproses:`, error);
        await handlers.failList(ctx, error);
    }
}

/**
 * Menjalankan satu siklus Batch Worker.
 *
 * Template function — sama seperti executeListWorker, urutan langkah
 * fix di sini.
 *
 * Flow:
 *
 * 1. Claim Batch berikutnya (menandai processing).
 * 2. Cek abort.
 * 3. Fetch data provider, mapping, validasi, transform, upsert.
 * 4. Complete Batch.
 * 5. Update progress List & Job.
 * 6. Jika gagal di step manapun -> failBatch.
 */
export async function executeBatchWorker(handlers: BatchWorkerHandlers): Promise<void> {
    const ctx = await handlers.claimNextBatch();
    if (!ctx) return;

    if (await handlers.isBatchAborted(ctx)) return;

    try {
        await handlers.processBatch(ctx);
        await handlers.completeBatch(ctx);
        await handlers.updateListProgress(ctx);
        await handlers.updateJobProgress(ctx);
    } catch (err) {
        const error = toError(err);
        console.error(
            `[SyncWorker] Batch #${ctx.batch.id} (List #${ctx.list.id}, Job #${ctx.job.id}) gagal diproses:`,
            error,
        );
        await handlers.failBatch(ctx, error);
    }
}