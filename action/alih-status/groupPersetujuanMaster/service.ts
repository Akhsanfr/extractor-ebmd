import { AlihStatusGroupPersetujuanMasterRepository } from "./repository";
import { db } from "@/drizzle";
import { AlihStatusGroupPersetujuanMasterContract } from "./contract";
import { verifyPermissions } from "@/lib/auth/auth";

export const AlihStatusGroupPersetujuanMasterService = {
    async getList(userId: string): Promise<AlihStatusGroupPersetujuanMasterContract.SelectDTO[]> {
        await verifyPermissions(userId, {
            "alih-status": ["read"]
        });
        return AlihStatusGroupPersetujuanMasterRepository.findAll(db);
    },

    async insert(data: AlihStatusGroupPersetujuanMasterContract.InsertDTO, userId: string): Promise<void> {
        await verifyPermissions(userId, {
            "alih-status": ["create"]
        });
        await AlihStatusGroupPersetujuanMasterRepository.insert(db, { ...data, createdAt: new Date(), createdBy: userId });
    },

    async removeByMasterId(data: AlihStatusGroupPersetujuanMasterContract.DeleteDTO, userId: string): Promise<void> {
        await verifyPermissions(userId, {
            "alih-status": ["delete"]
        });
        await AlihStatusGroupPersetujuanMasterRepository.removeByMasterId(db, data);
    },
};
