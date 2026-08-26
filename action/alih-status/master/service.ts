import { AlihStatusMasterRepository } from "./repository";
import { db } from "@/drizzle";
import { AlihStatusMasterContract } from "./contract";
import { verifyPermissions } from "@/lib/auth/auth";

export const AlihStatusMasterService = {
    async getList(userId: string): Promise<AlihStatusMasterContract.SelectDTO[]> {
        await verifyPermissions(userId, {
            "alih-status": ["read"]
        });
        return AlihStatusMasterRepository.findAll(db);
    },
    async getListWithSumData(userId: string): Promise<AlihStatusMasterContract.SelectWithSumDataDTO[]> {
        await verifyPermissions(userId, {
            "alih-status": ["read"]
        });
        return AlihStatusMasterRepository.findAllWithSumData(db);
    },


    async getById(id: number, userId: string): Promise<AlihStatusMasterContract.SelectDTO> {
        await verifyPermissions(userId, {
            "alih-status": ["read"]
        });
        return AlihStatusMasterRepository.findById(db, id);
    },

    async insert(data: AlihStatusMasterContract.InsertDTO, userId: string): Promise<void> {
        await verifyPermissions(userId, {
            "alih-status": ["create"]
        });
        await AlihStatusMasterRepository.insert(db, { ...data, createdAt: new Date(), createdBy: userId });
    },

    async update(data: AlihStatusMasterContract.EditDTO, userId: string): Promise<void> {
        await verifyPermissions(userId, {
            "alih-status": ["update"]
        });
        await AlihStatusMasterRepository.update(db, { ...data, updatedAt: new Date(), updatedBy: userId });
    },

    async remove(data: AlihStatusMasterContract.DeleteDTO, userId: string): Promise<void> {
        await verifyPermissions(userId, {
            "alih-status": ["delete"]
        });
        await AlihStatusMasterRepository.remove(db, { ...data, deletedAt: new Date(), deletedBy: userId });
    },
};