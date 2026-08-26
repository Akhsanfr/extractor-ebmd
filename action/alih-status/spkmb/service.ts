import { AlihStatusSpkmbRepository } from "./repository";
import { db } from "@/drizzle";
import { AlihStatusSpkmbContract } from "./contract";
import { verifyPermissions } from "@/lib/auth/auth";

export const AlihStatusSpkmbService = {
    async getByMasterId(userId: string, masterId: number): Promise<AlihStatusSpkmbContract.SelectDTO> {
        await verifyPermissions(userId, {
            "alih-status": ["read"]
        });
        return AlihStatusSpkmbRepository.findByMasterId(db, masterId);
    },

    async insert(data: AlihStatusSpkmbContract.InsertDTO, userId: string): Promise<void> {
        await verifyPermissions(userId, {
            "alih-status": ["create"]
        });
        await AlihStatusSpkmbRepository.insert(db, { ...data, createdAt: new Date(), createdBy: userId });
    },

    async update(data: AlihStatusSpkmbContract.EditDTO, userId: string): Promise<void> {
        await verifyPermissions(userId, {
            "alih-status": ["update"]
        });
        await AlihStatusSpkmbRepository.update(db, { ...data, updatedAt: new Date(), updatedBy: userId });
    },

    async remove(data: AlihStatusSpkmbContract.DeleteDTO, userId: string): Promise<void> {
        await verifyPermissions(userId, {
            "alih-status": ["delete"]
        });
        await AlihStatusSpkmbRepository.remove(db, { ...data, deletedAt: new Date(), deletedBy: userId });
    },
};
