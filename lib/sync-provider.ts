import { OperationalError } from "@/action/actionResponse";
import type { SyncJobContract } from "@/action/sync/syncJob/syncJob.contract";

// Framework bersifat generic (lihat KONSEP: "Provider"). Setiap provider hanya
// wajib menyediakan daftar endpoint yang akan disinkronkan dan berapa banyak
// batch (halaman) per endpoint. Autentikasi, fetch data, parsing, dan retry
// aktual dijalankan oleh worker masing-masing provider, BUKAN oleh framework.
//
// PERUBAHAN: plan() sekarang menerima `input` — konfigurasi yang dikirim user
// saat membuat Job (contoh EBMD: daftar endpoint + jenis aset yang dipilih).
// Setiap provider bertanggung jawab memvalidasi bentuk input miliknya sendiri
// menggunakan Contract masing-masing (mis. SyncEbmdContract.providerList).

export type SyncProviderPlan = {
    endpoint: string;
    worker: string;
    /** Berapa banyak batch (halaman) yang perlu dibuat untuk endpoint ini */
    batchCount: number;
    batchSize: number;
};

export interface SyncProvider {
    plan(input: unknown): Promise<SyncProviderPlan[]>;
}

const providerRegistry = new Map<SyncJobContract.CreateDTO["jobType"], SyncProvider>();

export function registerSyncProvider(
    jobType: SyncJobContract.CreateDTO["jobType"],
    provider: SyncProvider
) {
    providerRegistry.set(jobType, provider);
}

export function resolveSyncProvider(jobType: SyncJobContract.CreateDTO["jobType"]) {
    const provider = providerRegistry.get(jobType);

    if (!provider) {
        throw new OperationalError(
            `Provider untuk job type "${jobType}" belum terdaftar.`
        );
    }

    return provider;
}
