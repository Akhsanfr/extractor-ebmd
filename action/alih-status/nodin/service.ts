import { AlihStatusNodinRepository } from "./repository";
import { db } from "@/drizzle";
import { AlihStatusNodinContract } from "./contract";
import { verifyPermissions } from "@/lib/auth/auth";

export const AlihStatusNodinService = {
    async getByGroupId(groupId: number, userId: string): Promise<AlihStatusNodinContract.SelectDTO> {
        await verifyPermissions(userId, {
            "alih-status": ["read"]
        });
        return AlihStatusNodinRepository.findByGroupId(db, groupId);
    },

    async insert(data: AlihStatusNodinContract.InsertDTO, userId: string): Promise<void> {
        await verifyPermissions(userId, {
            "alih-status": ["create"]
        });
        await AlihStatusNodinRepository.insert(db, { ...data, createdAt: new Date(), createdBy: userId });
    },

    async update(data: AlihStatusNodinContract.EditDTO, userId: string): Promise<void> {
        await verifyPermissions(userId, {
            "alih-status": ["update"]
        });
        await AlihStatusNodinRepository.update(db, { ...data, updatedAt: new Date(), updatedBy: userId });
    },

    async remove(data: AlihStatusNodinContract.DeleteDTO, userId: string): Promise<void> {
        await verifyPermissions(userId, {
            "alih-status": ["delete"]
        });
        await AlihStatusNodinRepository.remove(db, { ...data, deletedAt: new Date(), deletedBy: userId });
    },
};
