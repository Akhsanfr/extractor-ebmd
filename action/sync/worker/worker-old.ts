
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
 * =============================================================================
 */

import { SyncBatchContract } from "../syncBatch/syncBatch.contract";
import { SyncJobContract } from "../syncJob/syncJob.contract";
import { SyncListContract } from "../syncList/syncList.contract";

// type SyncJobRow = typeof syncJobTable.$inferSelect;
// type SyncListRow = typeof syncListTable.$inferSelect;
// type SyncBatchRow = typeof syncBatchTable.$inferSelect;

/**
 * Konteks yang dibawa sepanjang siklus List Worker.
 * Diteruskan sebagai parameter antar step, BUKAN disimpan sebagai
 * instance field — worker instance yang sama bisa dipanggil untuk
 * banyak list secara bersamaan (concurrent polling), jadi state
 * tidak boleh nempel di `this`.
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

export abstract class SyncWorker {
    /**
     * Jumlah maksimum retry sebelum List/Batch ditandai `failed`.
     * Wajib diisi oleh subclass agar retry policy eksplisit,
     * bukan tersembunyi di masing-masing implementasi failList/failBatch.
     */
    protected abstract readonly maxRetry: number;

    // -------------------------------------------------------------------------
    // LIST WORKER
    // -------------------------------------------------------------------------

    /**
     * Menjalankan satu siklus List Worker.
     *
     * Ini adalah template method — urutan langkah sudah fix di sini,
     * subclass hanya perlu mengisi tiap step lewat method abstract di
     * bawah. Jangan di-override kecuali benar-benar perlu mengubah alur.
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
    async executeListWorker(): Promise<void> {
        const ctx = await this.claimNextList();
        if (!ctx) return;

        if (await this.isListAborted(ctx)) return;

        try {
            const prep = await this.prepareList(ctx);
            await this.createBatch(ctx, prep);
            await this.finishListPreparation(ctx, prep);
        } catch (err) {
            await this.failList(ctx, this.toError(err));
        }
    }

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
    protected abstract claimNextList(): Promise<ListContext | null>;

    /**
     * Mengecek apakah SyncList (atau SyncJob induknya) sudah dibatalkan
     * setelah diklaim, sebelum mulai proses prepare yang mahal (network call
     * ke provider). Dicek ulang oleh implementasi konkret jika prepare
     * berjalan lama / streaming.
     */
    protected abstract isListAborted(ctx: ListContext): Promise<boolean>;

    /**
     * Menjalankan proses persiapan provider.
     *
     * Tanggung jawab provider:
     *
     * - autentikasi
     * - download resource
     * - request metadata
     * - menghitung jumlah batch
     */
    protected abstract prepareList(ctx: ListContext): Promise<PrepareListResult>;

    /**
     * Membuat seluruh SyncBatch berdasarkan hasil prepare.
     *
     * Contoh:
     *
     * totalData = 12.000
     * batchSize = 500
     *
     * menghasilkan
     *
     * page 1
     * page 2
     * ...
     * page 24
     *
     * Batch hanya berisi metadata pekerjaan.
     * Batch belum diproses.
     */
    protected abstract createBatch(ctx: ListContext, prep: PrepareListResult): Promise<void>;

    /**
     * Menyelesaikan tahap persiapan.
     *
     * Update:
     *
     * - totalBatch
     * - resource
     *
     * Status List tetap processing.
     *
     * List baru dianggap completed
     * apabila seluruh Batch selesai diproses (lihat updateListProgress).
     */
    protected abstract finishListPreparation(ctx: ListContext, prep: PrepareListResult): Promise<void>;

    /**
     * Menangani kegagalan List.
     *
     * Update:
     *
     * - retryCount
     * - lastError
     * - status (kembali ke `pending` jika retryCount < maxRetry,
     *   `failed` jika sudah habis)
     */
    protected abstract failList(ctx: ListContext, error: Error): Promise<void>;

    // -------------------------------------------------------------------------
    // BATCH WORKER
    // -------------------------------------------------------------------------

    /**
     * Menjalankan satu siklus Batch Worker.
     *
     * Template method — sama seperti executeListWorker, urutan langkah
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
    async executeBatchWorker(): Promise<void> {
        const ctx = await this.claimNextBatch();
        if (!ctx) return;

        if (await this.isBatchAborted(ctx)) return;

        try {
            await this.processBatch(ctx);
            await this.completeBatch(ctx);
            await this.updateListProgress(ctx);
            await this.updateJobProgress(ctx);
        } catch (err) {
            await this.failBatch(ctx, this.toError(err));
        }
    }

    /**
     * Mengambil satu Batch menggunakan row locking dan menandainya
     * `processing` dalam transaction yang sama.
     *
     * Query WHERE harus mengecualikan status `aborted`.
     *
     * Return null jika tidak ada Batch pending.
     */
    protected abstract claimNextBatch(): Promise<BatchContext | null>;

    /**
     * Mengecek apakah Batch/List/Job sudah dibatalkan setelah diklaim.
     */
    protected abstract isBatchAborted(ctx: BatchContext): Promise<boolean>;

    /**
     * Memproses satu Batch.
     *
     * Tahapan:
     *
     * - fetch provider
     * - parsing
     * - transform
     * - validasi
     * - upsert database
     *
     * Fungsi ini TIDAK mengubah status parent.
     */
    protected abstract processBatch(ctx: BatchContext): Promise<void>;

    /**
     * Menandai Batch selesai diproses.
     *
     * Update:
     *
     * - status = completed
     * - finishedAt
     */
    protected abstract completeBatch(ctx: BatchContext): Promise<void>;

    /**
     * Memperbarui progress SyncList.
     *
     * Increment:
     *
     * completedBatch
     *
     * Jika seluruh Batch selesai:
     *
     * - status = completed
     * - finishedAt
     *
     * Wajib atomic (mis. UPDATE ... SET completedBatch = completedBatch + 1)
     * agar aman terhadap batch worker lain yang update bersamaan.
     */
    protected abstract updateListProgress(ctx: BatchContext): Promise<void>;

    /**
     * Memperbarui progress SyncJob.
     *
     * Increment:
     *
     * completedList
     *
     * Jika seluruh SyncList selesai:
     *
     * - status = completed
     * - finishedAt
     *
     * Wajib atomic, sama seperti updateListProgress.
     */
    protected abstract updateJobProgress(ctx: BatchContext): Promise<void>;

    /**
     * Menangani kegagalan Batch.
     *
     * Update:
     *
     * - retryCount
     * - lastError
     *
     * Jika retry telah habis (retryCount >= maxRetry):
     *
     * - status = failed
     * - increment failedBatch pada List (dan failedList pada Job jika
     *   seluruh batch List tersebut sudah final)
     */
    protected abstract failBatch(ctx: BatchContext, error: Error): Promise<void>;

    // -------------------------------------------------------------------------
    // HELPERS
    // -------------------------------------------------------------------------

    private toError(err: unknown): Error {
        return err instanceof Error ? err : new Error(String(err));
    }
}