import { runEbmdBatchWorker, runEbmdListWorker } from "./ebmdSync.worker";

const LOG_TAG = "[ebmdSyncRunner]";

/**
 * Dipanggil oleh scheduler/cron untuk List Worker.
 * Cukup dipanggil sekali per tick — kalau tidak ada SyncList pending,
 * worker langsung return tanpa melakukan apa-apa (lihat executeListWorker
 * di worker.ts).
 */
export async function runEbmdListWorkerOnce(): Promise<void> {
    try {
        await runEbmdListWorker();
    } catch (err) {
        // executeListWorker sendiri sudah menangani error per-List lewat
        // failList, jadi kalau error sampai lolos ke sini artinya ada
        // masalah di luar siklus normal (mis. koneksi DB putus total).
        console.error(`${LOG_TAG} runEbmdListWorkerOnce gagal tak terduga:`, err);
        throw err;
    }
}

/**
 * Dipanggil oleh scheduler/queue-consumer untuk Batch Worker.
 * Biasanya dijalankan lebih sering / dengan beberapa instance paralel
 * karena FOR UPDATE SKIP LOCKED membuatnya aman diklaim bersamaan.
 */
export async function runEbmdBatchWorkerOnce(): Promise<void> {
    try {
        await runEbmdBatchWorker();
    } catch (err) {
        console.error(`${LOG_TAG} runEbmdBatchWorkerOnce gagal tak terduga:`, err);
        throw err;
    }
}

/**
 * Contoh loop sederhana untuk polling terus-menerus (mis. dijalankan
 * sebagai long-running process/worker dyno, bukan cron per-tick).
 *
 * Kegagalan satu siklus TIDAK menghentikan loop — dicatat lalu lanjut ke
 * iterasi berikutnya, supaya satu error tidak mematikan seluruh worker.
 */
export async function pollEbmdBatchWorker(intervalMs = 2000): Promise<never> {
    for (;;) {
        try {
            await runEbmdBatchWorkerOnce();
        } catch (err) {
            console.error(`${LOG_TAG} pollEbmdBatchWorker: satu siklus gagal, lanjut ke iterasi berikutnya:`, err);
        }
        await new Promise((resolve) => setTimeout(resolve, intervalMs));
    }
}
