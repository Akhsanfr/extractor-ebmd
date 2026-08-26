import { AlihStatusPermohonanRepository } from "./repository";
import { db } from "@/drizzle";
import { AlihStatusPermohonanContract } from "./contract";
import { verifyPermissions } from "@/lib/auth/auth";

export const AlihStatusPermohonanService = {
    async getByMasterId(userId: string, masterId: number): Promise<AlihStatusPermohonanContract.SelectDTO> {
        await verifyPermissions(userId, {
            "alih-status": ["read"]
        });
        return AlihStatusPermohonanRepository.findByMasterId(db, masterId);
    },

    async insert(data: AlihStatusPermohonanContract.InsertDTO, userId: string): Promise<void> {
        await verifyPermissions(userId, {
            "alih-status": ["create"]
        });
        await AlihStatusPermohonanRepository.insert(db, { ...data, createdAt: new Date(), createdBy: userId });
    },

    async update(data: AlihStatusPermohonanContract.EditDTO, userId: string): Promise<void> {
        await verifyPermissions(userId, {
            "alih-status": ["update"]
        });
        await AlihStatusPermohonanRepository.update(db, { ...data, updatedAt: new Date(), updatedBy: userId });
    },

    async remove(data: AlihStatusPermohonanContract.DeleteDTO, userId: string): Promise<void> {
        await verifyPermissions(userId, {
            "alih-status": ["delete"]
        });
        await AlihStatusPermohonanRepository.remove(db, { ...data, deletedAt: new Date(), deletedBy: userId });
    },
};
