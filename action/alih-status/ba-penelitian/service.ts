import { AlihStatusBAPenelitianRepository } from "./repository";
import { db } from "@/drizzle";
import { AlihStatusBAPenelitianContract } from "./contract";
import { verifyPermissions } from "@/lib/auth/auth";
import { AlihStatusDataRepository } from "../data/repository";
import AlihStatusPermohonan from "@/app/dashboard/alih-status/permohonan/[id]/permohonan";
import { AlihStatusPermohonanRepository } from "../permohonan/repository";
import { OperationalError } from "@/action/actionResponse";
import { AlihStatusTrackingRepository } from "../tracking/repository";
import { AlihStatusTrackingSourceType } from "@/enum/alihStatus";

export const AlihStatusBAPenelitianService = {
    async getList(userId: string, tahun: number): Promise<AlihStatusBAPenelitianContract.SelectDTO[]> {
        await verifyPermissions(userId, {
            "alih-status": ["read"]
        });
        return AlihStatusBAPenelitianRepository.findAll(db, tahun);
    },

    async getDetailWithDetail(userId: string, id: number): Promise<AlihStatusBAPenelitianContract.SelectWithDetailDTO> {
        await verifyPermissions(userId, {
            "alih-status": ["read"]
        });
        const BAPenelitian = await AlihStatusBAPenelitianRepository.findById(db, id);
        const data = await AlihStatusDataRepository.find(db, { BAPenelitianId: [id] });
        const permohonanIds = [...new Set(data.map(e => e.permohonanId))].filter((id): id is number => id !== null && id !== undefined);
        const permohonan = await AlihStatusPermohonanRepository.findByIds(db, permohonanIds);

        const tracking = await AlihStatusTrackingRepository.findBySource(db, {
            sourceId: id,
            sourceType: AlihStatusTrackingSourceType.ALIH_STATUS_BA_PENELITIAN
        })
        return {
            tracking,
            BAPenelitian,
            permohonan,
            data
        };
    },
    async getForAvailableNodin(userId: string, tahun: number): Promise<AlihStatusBAPenelitianContract.SelectDTO[]> {
        await verifyPermissions(userId, {
            "alih-status": ["read"]
        });
        return AlihStatusBAPenelitianRepository.findForAvailableNodin(db, tahun);
    },
    async insert(data: AlihStatusBAPenelitianContract.CreateDTO, userId: string): Promise<AlihStatusBAPenelitianContract.SelectDTO> {
        await verifyPermissions(userId, {
            "alih-status": ["create"]
        });
        return await db.transaction(async tx => {
            const res = await AlihStatusBAPenelitianRepository.insert(tx, { ...data, createdAt: new Date(), createdBy: userId });
            await AlihStatusDataRepository.link(tx, data.dataIds, { BAPenelitianId: res.id })
            return res;
        })
    },

    async update(data: AlihStatusBAPenelitianContract.EditDTO, userId: string): Promise<AlihStatusBAPenelitianContract.SelectDTO> {
        await verifyPermissions(userId, {
            "alih-status": ["update"]
        });
        return await AlihStatusBAPenelitianRepository.update(db, { ...data, updatedAt: new Date(), updatedBy: userId });
    },

    async remove(data: AlihStatusBAPenelitianContract.DeleteDTO, userId: string): Promise<void> {
        await verifyPermissions(userId, {
            "alih-status": ["delete"]
        });
        await AlihStatusBAPenelitianRepository.remove(db, { ...data, deletedAt: new Date(), deletedBy: userId });
    },
};
