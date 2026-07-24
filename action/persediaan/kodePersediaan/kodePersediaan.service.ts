import { createHash } from "node:crypto";
import { db } from "@/drizzle";
import { KodePersediaanContract } from "./kodePersediaan.contract";
import {
    findKodePersediaanBatchForHash,
    applyHashRebuildBatch,
} from "./kodePersediaan.repository";

const REBUILD_BATCH_SIZE = 500;

export const KodePersediaanService = {
    async createHash(
        params: KodePersediaanContract.CreateHashDTO,
    ): Promise<string> {
        const content = [
            params.kategori,
            params.nama108,
            params.namaBarang,
            params.satuan,
            params.keywords ?? "",
        ].join("|");

        return createHash("sha256")
            .update(content, "utf8")
            .digest("hex");
    },

    /**
     * Rebuild hash untuk SEMUA baris kodePersediaan (bukan cuma yang NULL) —
     * karena formula createHash() bisa berubah kapan saja (mis. nambah kolom
     * baru yang ikut di-embed), yang berarti hash lama jadi tidak valid untuk
     * SEMUA baris, bukan cuma yang belum pernah di-hash.
     *
     * Baris yang hash barunya beda dari yang tersimpan akan di-update, dan
     * baris embedding-nya di-requeue ('pending') supaya worker regenerasi
     * embedding pakai konten kolom terbaru.
     *
     * Berjalan paginated (keyset by id) supaya aman untuk tabel besar —
     * tidak nge-load semua baris ke memori sekaligus, mirip pola
     * backfillMissingEmbeddingRows().
     */
    async rebuildHash(): Promise<{ checked: number; updated: number }> {
        let cursor = 0;
        let checked = 0;
        let updated = 0;

        console.log("🚀 Mulai rebuild hash kodePersediaan...");

        while (true) {
            const rows = await findKodePersediaanBatchForHash(db, {
                cursor,
                limit: REBUILD_BATCH_SIZE,
            });
            if (rows.length === 0) break;

            const toUpdate: { id: number; contentHash: string }[] = [];

            for (const row of rows) {
                const newHash = await this.createHash({
                    kategori: row.kategori ?? "",
                    nama108: row.nama108,
                    namaBarang: row.namaBarang,
                    satuan: row.satuan,
                    keywords: row.keywords,
                });

                if (newHash !== row.contentHash) {
                    toUpdate.push({ id: row.id, contentHash: newHash });
                }
            }

            if (toUpdate.length > 0) {
                await applyHashRebuildBatch(db, toUpdate);
                updated += toUpdate.length;
            }

            checked += rows.length;
            cursor = rows[rows.length - 1].id;

            console.log(
                `📦 Batch: ${rows.length} dicek, ${toUpdate.length} di-update (total dicek: ${checked}, total update: ${updated})`,
            );
        }

        console.log(`🏁 Rebuild hash selesai. Dicek: ${checked}, di-update: ${updated}.`);
        return { checked, updated };
    },
};