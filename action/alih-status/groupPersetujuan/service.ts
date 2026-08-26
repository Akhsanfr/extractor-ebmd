import { AlihStatusGroupPersetujuanRepository } from "./repository";
import { db } from "@/drizzle";
import { AlihStatusGroupPersetujuanContract } from "./contract";
import { verifyPermissions } from "@/lib/auth/auth";
import { AlihStatusMasterContract } from "../master/contract";
import { AlihStatusMasterRepository } from "../master/repository";

export const AlihStatusGroupPersetujuanService = {
    async getList(userId: string): Promise<AlihStatusGroupPersetujuanContract.SelectDTO[]> {
        await verifyPermissions(userId, {
            "alih-status": ["read"]
        });
        return AlihStatusGroupPersetujuanRepository.findAll(db);
    },
    async getById(id: number, userId: string): Promise<AlihStatusGroupPersetujuanContract.SelectDTO> {
        await verifyPermissions(userId, {
            "alih-status": ["read"]
        });
        return AlihStatusGroupPersetujuanRepository.findById(db, id);
    },

    async insert(data: AlihStatusGroupPersetujuanContract.InsertDTO, userId: string): Promise<void> {
        await verifyPermissions(userId, {
            "alih-status": ["create"]
        });
        await AlihStatusGroupPersetujuanRepository.insert(db, { ...data, createdAt: new Date(), createdBy: userId });
    },

    async update(data: AlihStatusGroupPersetujuanContract.EditDTO, userId: string): Promise<void> {
        await verifyPermissions(userId, {
            "alih-status": ["update"]
        });
        await AlihStatusGroupPersetujuanRepository.update(db, { ...data, updatedAt: new Date(), updatedBy: userId });
    },

    async remove(data: AlihStatusGroupPersetujuanContract.DeleteDTO, userId: string): Promise<void> {
        await verifyPermissions(userId, {
            "alih-status": ["delete"]
        });
        await AlihStatusGroupPersetujuanRepository.remove(db, { ...data, deletedAt: new Date(), deletedBy: userId });
    },
    async getListMasterWithSumDataByGroupPersetujuan(userId: string, groupId: number): Promise<AlihStatusMasterContract.SelectWithSumDataDTO[]> {
        await verifyPermissions(userId, {
            "alih-status": ["read"]
        });
        return AlihStatusMasterRepository.findAllWithSumDataByGroupPersetujuan(db, groupId);
    },
};
