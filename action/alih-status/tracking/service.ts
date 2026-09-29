import { db } from "@/drizzle";
import { verifyPermissions } from "@/lib/auth/auth";
import { AlihStatusTrackingContract } from "./contract";
import { AlihStatusTrackingRepository } from "./repository";
import { AlihStatusTrackingSourceType } from "@/enum/alihStatus";

export const AlihStatusTrackingService = {
    async getBySource(
        userId: string, query: AlihStatusTrackingContract.QueryDTO): Promise<AlihStatusTrackingContract.SelectDTO[]> {
        await verifyPermissions(userId, {
            "alih-status": ["read"]
        });
        return AlihStatusTrackingRepository.findBySource(db, query);
    },

    async insert(
        userId: string,
        data: AlihStatusTrackingContract.CreateDTO
    ): Promise<AlihStatusTrackingContract.SelectDTO> {
        await verifyPermissions(userId, {
            "alih-status": ["create"]
        });
        const res = await AlihStatusTrackingRepository.create(db, {
            ...data,
            createdBy: userId,
        });
        if (!res) throw new Error("Gagal membuat data tracking");
        return res;
    },

    async update(
        data: AlihStatusTrackingContract.EditDTO,
        userId: string
    ): Promise<AlihStatusTrackingContract.SelectDTO> {
        await verifyPermissions(userId, {
            "alih-status": ["update"]
        });
        // id dipisah agar tidak ikut masuk ke .set() (kolom identity tidak bisa di-update)
        const res = await AlihStatusTrackingRepository.update(db, {
            ...data,
            updatedAt: new Date(),
            updatedBy: userId,
        });
        if (!res) throw new Error("Data tracking tidak ditemukan");
        return res;
    },
};