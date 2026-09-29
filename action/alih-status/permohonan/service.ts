import { AlihStatusPermohonanRepository } from "./repository";
import { db } from "@/drizzle";
import { AlihStatusPermohonanContract } from "./contract";
import { verifyPermissions } from "@/lib/auth/auth";
import { AlihStatusSpkmbRepository } from "../spkmb/repository";
import { AlihStatusDataRepository } from "../data/repository";
import { AlihStatusBAPenelitianRepository } from "../ba-penelitian/repository";
import { AlihStatusTrackingRepository } from "../tracking/repository";
import { AlihStatusTrackingSourceType } from "@/enum/alihStatus";

export const AlihStatusPermohonanService = {
    async get(userId: string, id: number): Promise<AlihStatusPermohonanContract.SelectDTO> {
        await verifyPermissions(userId, {
            "alih-status": ["read"]
        });
        return AlihStatusPermohonanRepository.findById(db, id);
    },
    async getList(userId: string, tahun: number): Promise<AlihStatusPermohonanContract.SelectDTO[]> {
        await verifyPermissions(userId, {
            "alih-status": ["read"]
        });
        return AlihStatusPermohonanRepository.find(db, tahun);
    },
    async getWithDetail(userId: string, id: number): Promise<AlihStatusPermohonanContract.SelectWithDetailDTO> {
        await verifyPermissions(userId, {
            "alih-status": ["read"]
        });
        const permohonan = await AlihStatusPermohonanRepository.findById(db, id);
        const data = await AlihStatusDataRepository.findByPermohonanId(db, id);
        const spkmb = await AlihStatusSpkmbRepository.findByIds(db,
            [...new Set(data.map((item) => item.spkmbId).filter(d => d !== null))]);


        const tracking = await AlihStatusTrackingRepository.findBySource(db, {
            sourceId: id,
            sourceType: AlihStatusTrackingSourceType.ALIH_STATUS_PERMOHONAN
        })
        return {
            permohonan,
            data,
            spkmb,
            tracking
        };
    },
    async getForAvailableBAPenelitian(userId: string, tahun: number): Promise<AlihStatusPermohonanContract.SelectDTO[]> {
        await verifyPermissions(userId, {
            "alih-status": ["read"]
        });
        return AlihStatusPermohonanRepository.findForAvailableBaPenelitian(db, tahun);
    },

    async insert(data: AlihStatusPermohonanContract.InsertDTO, userId: string): Promise<AlihStatusPermohonanContract.SelectDTO> {
        await verifyPermissions(userId, {
            "alih-status": ["create"]
        });
        return await AlihStatusPermohonanRepository.insert(db, { ...data, createdAt: new Date(), createdBy: userId });
    },

    async update(data: AlihStatusPermohonanContract.EditDTO, userId: string): Promise<AlihStatusPermohonanContract.SelectDTO> {
        await verifyPermissions(userId, {
            "alih-status": ["update"]
        });
        return await AlihStatusPermohonanRepository.update(db, { ...data, updatedAt: new Date(), updatedBy: userId });
    },

    async remove(data: AlihStatusPermohonanContract.DeleteDTO, userId: string): Promise<void> {
        await verifyPermissions(userId, {
            "alih-status": ["delete"]
        });
        await AlihStatusPermohonanRepository.remove(db, { ...data, deletedAt: new Date(), deletedBy: userId });
    },
};
