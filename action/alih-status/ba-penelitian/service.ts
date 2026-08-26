import { AlihStatusBAPenelitianRepository } from "./repository";
import { db } from "@/drizzle";
import { AlihStatusBAPenelitianContract } from "./contract";
import { verifyPermissions } from "@/lib/auth/auth";

export const AlihStatusBAPenelitianService = {
    async getList(userId: string): Promise<AlihStatusBAPenelitianContract.SelectDTO[]> {
        await verifyPermissions(userId, {
            "alih-status": ["read"]
        });
        return AlihStatusBAPenelitianRepository.findAll(db);
    },

    async insert(data: AlihStatusBAPenelitianContract.InsertDTO, userId: string): Promise<void> {
        await verifyPermissions(userId, {
            "alih-status": ["create"]
        });
        await AlihStatusBAPenelitianRepository.insert(db, { ...data, createdAt: new Date(), createdBy: userId });
    },

    async update(data: AlihStatusBAPenelitianContract.EditDTO, userId: string): Promise<void> {
        await verifyPermissions(userId, {
            "alih-status": ["update"]
        });
        await AlihStatusBAPenelitianRepository.update(db, { ...data, updatedAt: new Date(), updatedBy: userId });
    },

    async remove(data: AlihStatusBAPenelitianContract.DeleteDTO, userId: string): Promise<void> {
        await verifyPermissions(userId, {
            "alih-status": ["delete"]
        });
        await AlihStatusBAPenelitianRepository.remove(db, { ...data, deletedAt: new Date(), deletedBy: userId });
    },
};
