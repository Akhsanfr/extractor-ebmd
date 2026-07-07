import { db } from "@/drizzle";
import { bmdSubSyncRepository } from "./bmdSubSync.repository";
import { OperationalError } from "../actionResponse";

export const bmdSubSyncService = {
    async getBySyncId(syncId: number) {
        return bmdSubSyncRepository.getBySyncId(db, syncId);
    },

    /**
     * Stop per-row. Jika sedang berjalan, engine akan menghentikannya di batas
     * chunk terdekat (dicek oleh engine). Jika belum berjalan, engine akan
     * langsung men-skip saat gilirannya tiba.
     */
    async stopRow(subSyncId: number): Promise<void> {
        const subSync = await bmdSubSyncRepository.getById(db, subSyncId);
        if (!subSync) throw new OperationalError("Sub-sync tidak ditemukan");

        if (subSync.status === "success" || subSync.status === "failed") {
            throw new OperationalError("Sub-sync sudah selesai, tidak dapat dihentikan");
        }

        await bmdSubSyncRepository.requestStop(db, subSyncId);
    },
};