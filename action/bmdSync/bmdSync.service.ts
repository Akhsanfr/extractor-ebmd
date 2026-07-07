import { EbmdRow, fetchAndParseEbmd } from "@/lib/bmdSync/ebmdClient";
import { syncRunnerRegistry } from "@/lib/bmdSync/syncRunnerRegistry"
import { bmdSubSyncRepository } from "../bmdSubSync/bmdSubSync.repository";
import { OperationalError } from "../actionResponse";
import { db } from "@/drizzle";
import { bmdRepository } from "../bmd/bmd.repository";
import { bmdSyncRepository } from "./bmdSync.repository";
import { BmdSyncContract } from "./bmdSync.contract";

const CHUNK_SIZE = 500;
const MAX_RETRY = 3;

function mapRowToBmd(row: EbmdRow, perangkatDaerahKodeLokasi: string) {
    return {
        nibar: row.nibar,
        nomorRegister: row.nomorRegister,
        kodeBarang: row.kodeBarang,
        namaBarang: row.namaBarang,
        spesifikasiNamaBarang: row.spesifikasiNamaBarang,
        spesifikasiLainnya: row.spesifikasiLainnya ?? null,
        jumlah: String(row.jumlah), // kolom numeric drizzle menerima string
        satuan: row.satuan ?? null,
        lokasi: row.lokasi,
        perangkatDaerahKodeLokasi,
    };
}

/**
 * Memproses satu sub-sync sampai chunk terakhir atau sampai stop diminta.
 * Mengembalikan status akhir untuk sub-sync ini pada percobaan saat ini.
 * Melempar error jika fetch/parsing/upsert gagal (ditangkap oleh caller untuk retry).
 */
async function runChunks(subSyncId: number): Promise<"success" | "stopped"> {
    const subSync = await bmdSubSyncRepository.getById(db, subSyncId);
    if (!subSync) throw new OperationalError("Sub-sync tidak ditemukan");

    const rows = await fetchAndParseEbmd({
        perangkatDaerahKodeLokasi: subSync.perangkatDaerahKodeLokasi,
        assetType: subSync.assetType,
    });

    await bmdSubSyncRepository.update(db, subSyncId, { totalData: rows.length });

    for (let start = subSync.lastProcessedRow; start < rows.length; start += CHUNK_SIZE) {
        // cek sinyal stop per-row di setiap batas chunk
        const current = await bmdSubSyncRepository.getById(db, subSyncId);
        if (current?.stopRequested) {
            await bmdSubSyncRepository.update(db, subSyncId, {
                status: "stopped",
                stopRequested: false,
                finishedAt: new Date(),
            });
            return "stopped";
        }

        const chunk = rows.slice(start, start + CHUNK_SIZE);
        await bmdRepository.upsertMany(
            db,
            chunk.map((row) => mapRowToBmd(row, subSync.perangkatDaerahKodeLokasi)),
        );

        const processed = start + chunk.length;
        await bmdSubSyncRepository.update(db, subSyncId, {
            lastProcessedRow: processed,
            successData: processed,
        });
    }

    return "success";
}

/** Menjalankan satu sub-sync dengan retry maksimal 3x, selalu lanjut dari checkpoint. */
async function runSubSyncWithRetry(subSyncId: number): Promise<"success" | "stopped" | "failed"> {
    const initial = await bmdSubSyncRepository.getById(db, subSyncId);
    if (!initial) throw new OperationalError("Sub-sync tidak ditemukan");

    // Skip lebih dulu jika sudah diminta stop sebelum sempat berjalan sama sekali.
    if (initial.stopRequested) {
        await bmdSubSyncRepository.update(db, subSyncId, {
            status: "stopped",
            stopRequested: false,
        });
        return "stopped";
    }

    await bmdSubSyncRepository.update(db, subSyncId, {
        status: "running",
        retryCount: 0,
        errorMessage: null,
        startedAt: initial.startedAt ?? new Date(),
    });

    // eslint-disable-next-line no-constant-condition
    while (true) {
        const current = await bmdSubSyncRepository.getById(db, subSyncId);
        if (!current) throw new OperationalError("Sub-sync tidak ditemukan");

        try {
            const result = await runChunks(subSyncId);
            if (result === "stopped") return "stopped";

            await bmdSubSyncRepository.update(db, subSyncId, {
                status: "success",
                finishedAt: new Date(),
            });
            return "success";
        } catch (error) {
            const nextRetry = current.retryCount + 1;
            const message = error instanceof Error ? error.message : String(error);

            if (nextRetry < MAX_RETRY) {
                await bmdSubSyncRepository.update(db, subSyncId, {
                    retryCount: nextRetry,
                    errorMessage: message,
                });
                continue; // lanjut retry dari checkpoint (lastProcessedRow sudah tersimpan)
            }

            await bmdSubSyncRepository.update(db, subSyncId, {
                status: "failed",
                retryCount: nextRetry,
                errorMessage: message,
                finishedAt: new Date(),
            });
            return "failed";
        }
    }
}

function determineFinalStatus(counts: {
    pending: number;
    running: number;
    stopped: number;
    success: number;
    failed: number;
}): "success" | "partial_success" | "failed" {
    if (counts.failed > 0 && counts.success === 0) return "failed";
    if (counts.failed > 0 || counts.stopped > 0 || counts.pending > 0) return "partial_success";
    return "success";
}

/** Loop utama: memproses seluruh sub-sync yang resumable secara berurutan. */
async function runSyncLoop(syncId: number): Promise<void> {
    if (!syncRunnerRegistry.tryStart(syncId)) return; // sudah berjalan, hindari duplikasi

    try {
        await bmdSyncRepository.update(db, syncId, {
            status: "running",
            stopRequested: false,
            startedAt: new Date(),
        });

        const subSyncs = await bmdSubSyncRepository.getResumable(db, syncId);

        for (const subSync of subSyncs) {
            const sync = await bmdSyncRepository.getById(db, syncId);
            if (sync?.stopRequested) {
                // status paused/stopped sudah di-set oleh action pause/stop
                return;
            }

            // sub-sync failed yang diresume ulang diberi kesempatan retry baru
            if (subSync.status === "failed") {
                await bmdSubSyncRepository.update(db, subSync.id, { retryCount: 0 });
            }

            await runSubSyncWithRetry(subSync.id);
        }

        const finalSync = await bmdSyncRepository.getById(db, syncId);
        if (finalSync?.stopRequested) return; // dihentikan tepat setelah sub-sync terakhir

        const counts = await bmdSubSyncRepository.getAggregateCounts(db, syncId);
        await bmdSyncRepository.update(db, syncId, {
            status: determineFinalStatus(counts),
            successSubSync: counts.success,
            failedSubSync: counts.failed,
            finishedAt: new Date(),
        });
    } finally {
        syncRunnerRegistry.finish(syncId);
    }
}

export const bmdSyncService = {
    async createSync(userId: string, dto: BmdSyncContract.CreateDTO) {
        const sync = await bmdSyncRepository.create(db, {
            status: "pending",
            createdBy: userId,
            totalSubSync: dto.items.reduce((acc, item) => acc + item.assetTypes.length, 0),
        });

        const subSyncData = dto.items.flatMap((item) =>
            item.assetTypes.map((assetType) => ({
                syncId: sync.id,
                perangkatDaerahKodeLokasi: item.perangkatDaerahKodeLokasi,
                assetType,
                status: "pending" as const,
            })),
        );

        await bmdSubSyncRepository.createMany(db, subSyncData);
        return sync;
    },

    /** Play: mulai proses. Tidak menunggu selesai — berjalan di background. */
    async play(syncId: number): Promise<void> {
        const sync = await bmdSyncRepository.getById(db, syncId);
        if (!sync) throw new OperationalError("Sync tidak ditemukan");
        if (sync.status === "running") return;

        // fire-and-forget: tidak di-await agar action langsung return ke client
        void runSyncLoop(syncId).catch(async (error) => {
            await bmdSyncRepository.update(db, syncId, {
                status: "failed",
                finishedAt: new Date(),
            });
            console.error(`[bmdSync] runSyncLoop gagal untuk sync ${syncId}:`, error);
        });
    },

    /** Resume: sama seperti play, hanya melanjutkan sub-sync yang belum success. */
    async resume(syncId: number): Promise<void> {
        return this.play(syncId);
    },

    /** Pause: minta berhenti di batas chunk terdekat, status akhir 'paused'. */
    async pause(syncId: number): Promise<void> {
        await bmdSyncRepository.update(db, syncId, {
            stopRequested: true,
            status: "paused",
        });
    },

    /** Stop: sama mekanismenya dengan pause, status akhir 'stopped'. */
    async stop(syncId: number): Promise<void> {
        await bmdSyncRepository.update(db, syncId, {
            stopRequested: true,
            status: "stopped",
        });
    },

    async getAll() {
        return bmdSyncRepository.getAll(db);
    },

    async getById(syncId: number) {
        const sync = await bmdSyncRepository.getById(db, syncId);
        if (!sync) throw new OperationalError("Sync tidak ditemukan");
        return sync;
    },
};