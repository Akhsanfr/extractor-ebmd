/**
 * Registry in-memory per proses Node. Hanya untuk mencegah satu bmd_sync
 * dijalankan dua kali secara paralel (misal user klik "Play" dua kali).
 * Sinyal pause/stop TIDAK disimpan di sini — sumber kebenaran untuk itu
 * adalah kolom `stopRequested` di database, supaya konsisten walau
 * proses Node di-restart (di VPS via pm2/systemd).
 */
const runningSyncIds = new Set<number>();

export const syncRunnerRegistry = {
    tryStart(syncId: number): boolean {
        if (runningSyncIds.has(syncId)) return false;
        runningSyncIds.add(syncId);
        return true;
    },
    finish(syncId: number): void {
        runningSyncIds.delete(syncId);
    },
    isRunning(syncId: number): boolean {
        return runningSyncIds.has(syncId);
    },
};