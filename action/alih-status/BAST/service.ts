import { AlihStatusBASTRepository } from "./repository";
import { db } from "@/drizzle";
import { AlihStatusBASTContract } from "./contract";
import { verifyPermissions } from "@/lib/auth/auth";

export const AlihStatusBASTService = {
    async getList(userId: string): Promise<AlihStatusBASTContract.SelectDTO[]> {
        await verifyPermissions(userId, {
            "alih-status": ["read"]
        });
        return AlihStatusBASTRepository.findAll(db);
    },

    async insert(data: AlihStatusBASTContract.InsertDTO, userId: string): Promise<void> {
        await verifyPermissions(userId, {
            "alih-status": ["create"]
        });
        await AlihStatusBASTRepository.insert(db, { ...data, createdAt: new Date(), createdBy: userId });
    },

    async update(data: AlihStatusBASTContract.EditDTO, userId: string): Promise<void> {
        await verifyPermissions(userId, {
            "alih-status": ["update"]
        });
        await AlihStatusBASTRepository.update(db, { ...data, updatedAt: new Date(), updatedBy: userId });
    },

    async remove(data: AlihStatusBASTContract.DeleteDTO, userId: string): Promise<void> {
        await verifyPermissions(userId, {
            "alih-status": ["delete"]
        });
        await AlihStatusBASTRepository.remove(db, { ...data, deletedAt: new Date(), deletedBy: userId });
    },
};
