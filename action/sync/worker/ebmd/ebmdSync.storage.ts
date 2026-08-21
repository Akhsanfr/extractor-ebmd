import { createHash } from "node:crypto";
import fs from "node:fs/promises";
import path from "node:path";

/**
 * Storage sementara untuk hasil extractFromEBMD.
 *
 * Kenapa perlu disimpan dulu (bukan langsung diproses)?
 * - extractFromEBMD memukul server eksternal (ebmd.pasuruankab.go.id) yang
 *   lambat & kadang tidak stabil. Kita tidak mau List Worker memanggilnya lagi
 *   setiap kali sebuah SyncBatch diproses/di-retry.
 * - Dengan menyimpan hasil sekali di List Worker, Batch Worker tinggal baca
 *   potongan (chunk) datanya dari storage — cepat, dan aman untuk retry.
 *
 * Implementasi di bawah ini pakai filesystem lokal supaya sederhana &
 * self-contained. Kalau butuh scale ke multi-instance/worker terpisah,
 * ganti isinya untuk pakai object storage (S3/MinIO) — kontraknya
 * (save/readChunk/delete) tetap sama sehingga worker tidak perlu berubah.
 */

const STORAGE_DIR = process.env.SYNC_STORAGE_DIR ?? "storage/sync/ebmd";
const LOG_TAG = "[EbmdStorage]";

/** Bentuk data yang disimpan di kolom `resource` (jsonb) milik SyncList. */
export type EbmdResource = {
    storageKey: string;
    totalRows: number;
    checksum: string;
    extractedAt: string;
};

async function resolvePath(storageKey: string): Promise<string> {
    await fs.mkdir(STORAGE_DIR, { recursive: true });
    return path.join(STORAGE_DIR, storageKey);
}

export const EbmdStorage = {
    /**
     * Menyimpan hasil mentah extractFromEBMD untuk satu SyncList.
     * Dipanggil sekali oleh List Worker (di dalam prepareList).
     */
    async save(listId: number, rows: unknown[]): Promise<EbmdResource> {
        const storageKey = `list-${listId}.json`;

        try {
            const filePath = await resolvePath(storageKey);
            const payload = JSON.stringify(rows);

            await fs.writeFile(filePath, payload, "utf-8");

            return {
                storageKey,
                totalRows: rows.length,
                checksum: createHash("sha1").update(payload).digest("hex"),
                extractedAt: new Date().toISOString(),
            };
        } catch (err) {
            console.error(`${LOG_TAG} save gagal untuk List #${listId} (storageKey=${storageKey}):`, err);
            throw err;
        }
    },

    /**
     * Mengambil satu halaman (chunk) dari data yang tersimpan.
     * Dipanggil berkali-kali oleh Batch Worker, satu kali per SyncBatch.
     *
     * page dimulai dari 1, mengikuti konvensi SyncBatch.batchPage.
     */
    async readChunk<T>(storageKey: string, page: number, size: number): Promise<T[]> {
        try {
            const filePath = await resolvePath(storageKey);
            const raw = await fs.readFile(filePath, "utf-8");
            const rows = JSON.parse(raw) as T[];

            const start = (page - 1) * size;
            return rows.slice(start, start + size);
        } catch (err) {
            console.error(`${LOG_TAG} readChunk gagal (storageKey=${storageKey}, page=${page}):`, err);
            throw err;
        }
    },

    /**
     * Hapus file storage. Panggil ini setelah SyncList benar-benar selesai
     * (semua batch completed) kalau tidak perlu disimpan untuk audit.
     * Opsional — aman untuk tidak dipanggil sama sekali.
     */
    async delete(storageKey: string): Promise<void> {
        try {
            const filePath = await resolvePath(storageKey);
            await fs.rm(filePath, { force: true });
        } catch (err) {
            console.error(`${LOG_TAG} delete gagal (storageKey=${storageKey}):`, err);
            throw err;
        }
    },
};
