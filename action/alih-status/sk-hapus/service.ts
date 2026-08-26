import { AlihStatusSKHapusRepository } from "./repository";
import { db } from "@/drizzle";
import { AlihStatusSKHapusContract } from "./contract";
import { verifyPermissions } from "@/lib/auth/auth";

export const AlihStatusSKHapusService = {
    async getList(userId: string): Promise<AlihStatusSKHapusContract.SelectDTO[]> {
        await verifyPermissions(userId, {
            "alih-status": ["read"]
        });
        return AlihStatusSKHapusRepository.findAll(db);
    },

    async insert(data: AlihStatusSKHapusContract.InsertDTO, userId: string): Promise<void> {
        await verifyPermissions(userId, {
            "alih-status": ["create"]
        });
        await AlihStatusSKHapusRepository.insert(db, { ...data, createdAt: new Date(), createdBy: userId });
    },

    async update(data: AlihStatusSKHapusContract.EditDTO, userId: string): Promise<void> {
        await verifyPermissions(userId, {
            "alih-status": ["update"]
        });
        await AlihStatusSKHapusRepository.update(db, { ...data, updatedAt: new Date(), updatedBy: userId });
    },

    async remove(data: AlihStatusSKHapusContract.DeleteDTO, userId: string): Promise<void> {
        await verifyPermissions(userId, {
            "alih-status": ["delete"]
        });
        await AlihStatusSKHapusRepository.remove(db, { ...data, deletedAt: new Date(), deletedBy: userId });
    },
};
