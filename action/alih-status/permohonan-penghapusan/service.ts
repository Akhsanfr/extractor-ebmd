import { AlihStatusPermohonanPenghapusanRepository } from "./repository";
import { db } from "@/drizzle";
import { AlihStatusPermohonanPenghapusanContract } from "./contract";
import { verifyPermissions } from "@/lib/auth/auth";

export const AlihStatusPermohonanPenghapusanService = {
    async getList(userId: string): Promise<AlihStatusPermohonanPenghapusanContract.SelectDTO[]> {
        await verifyPermissions(userId, {
            "alih-status": ["read"]
        });
        return AlihStatusPermohonanPenghapusanRepository.findAll(db);
    },

    async insert(data: AlihStatusPermohonanPenghapusanContract.InsertDTO, userId: string): Promise<void> {
        await verifyPermissions(userId, {
            "alih-status": ["create"]
        });
        await AlihStatusPermohonanPenghapusanRepository.insert(db, { ...data, createdAt: new Date(), createdBy: userId });
    },

    async update(data: AlihStatusPermohonanPenghapusanContract.EditDTO, userId: string): Promise<void> {
        await verifyPermissions(userId, {
            "alih-status": ["update"]
        });
        await AlihStatusPermohonanPenghapusanRepository.update(db, { ...data, updatedAt: new Date(), updatedBy: userId });
    },

    async remove(data: AlihStatusPermohonanPenghapusanContract.DeleteDTO, userId: string): Promise<void> {
        await verifyPermissions(userId, {
            "alih-status": ["delete"]
        });
        await AlihStatusPermohonanPenghapusanRepository.remove(db, { ...data, deletedAt: new Date(), deletedBy: userId });
    },
};
