import { AlihStatusNodinRepository } from "./repository";
import { db } from "@/drizzle";
import { AlihStatusNodinContract } from "./contract";
import { verifyPermissions } from "@/lib/auth/auth";
import { AlihStatusDataRepository } from "../data/repository";
import { AlihStatusPermohonanRepository } from "../permohonan/repository";
import { AlihStatusBAPenelitianRepository } from "../ba-penelitian/repository";
import { AlihStatusSpkmbRepository } from "../spkmb/repository";
import { AlihStatusTrackingRepository } from "../tracking/repository";
import { AlihStatusTrackingSourceType } from "@/enum/alihStatus";

export const AlihStatusNodinService = {
    async getList(userId: string, tahun: number): Promise<AlihStatusNodinContract.SelectDTO[]> {
        await verifyPermissions(userId, {
            "alih-status": ["read"]
        });
        return AlihStatusNodinRepository.findAll(db, tahun);
    },
    async getDetailWithDetail(userId: string, id: number): Promise<AlihStatusNodinContract.SelectWithDetailDTO> {
        await verifyPermissions(userId, {
            "alih-status": ["read"]
        });
        const nodin = await AlihStatusNodinRepository.findById(db, id);
        const data = await AlihStatusDataRepository.find(db, { nodinId: [id] });
        const spkmbIds = [...new Set(data.map(e => e.spkmbId))].filter((id): id is number => id !== null && id !== undefined);
        const spkmb = await AlihStatusSpkmbRepository.findByIds(db, spkmbIds);
        const BAPenelitianIds = [...new Set(data.map(e => e.BAPenelitianId))].filter((id): id is number => id !== null && id !== undefined);
        const BAPenelitian = await AlihStatusBAPenelitianRepository.findByIds(db, BAPenelitianIds);
        const permohonanIds = [...new Set(data.map(e => e.permohonanId))].filter((id): id is number => id !== null && id !== undefined);
        const permohonan = await AlihStatusPermohonanRepository.findByIds(db, permohonanIds);

        const tracking = await AlihStatusTrackingRepository.findBySource(db, {
            sourceId: id,
            sourceType: AlihStatusTrackingSourceType.ALIH_STATUS_NODIN
        })
        return {
            tracking,
            spkmb,
            nodin,
            permohonan,
            data,
            BAPenelitian
        };
    },
    async getForAvailablePersetujuanBupati(userId: string, tahun: number): Promise<AlihStatusNodinContract.SelectDTO[]> {
        await verifyPermissions(userId, {
            "alih-status": ["read"]
        });
        return AlihStatusNodinRepository.findForAvailablePersetujuanBupati(db, tahun);
    },

    async insert(data: AlihStatusNodinContract.CreateDTO, userId: string): Promise<AlihStatusNodinContract.SelectDTO> {
        await verifyPermissions(userId, {
            "alih-status": ["create"]
        });
        return await db.transaction(async tx => {
            const res = await AlihStatusNodinRepository.insert(tx, { ...data, createdAt: new Date(), createdBy: userId });
            await AlihStatusDataRepository.link(tx, data.dataIds, { nodinId: res.id })
            await AlihStatusTrackingRepository.create(tx, {
                date: new Date().toISOString().slice(0, 10),
                note: "Draft dibuat",
                position: "Staf PBMD",
                sourceType: AlihStatusTrackingSourceType.ALIH_STATUS_NODIN,
                sourceId: res.id,
                createdAt: new Date(),
                createdBy: userId,
            })
            return res;
        })
    },

    async update(data: AlihStatusNodinContract.EditDTO, userId: string): Promise<AlihStatusNodinContract.SelectDTO> {
        await verifyPermissions(userId, {
            "alih-status": ["update"]
        });
        return await AlihStatusNodinRepository.update(db, { ...data, updatedAt: new Date(), updatedBy: userId });
    },

    async remove(data: AlihStatusNodinContract.DeleteDTO, userId: string): Promise<void> {
        await verifyPermissions(userId, {
            "alih-status": ["delete"]
        });
        await AlihStatusNodinRepository.remove(db, { ...data, deletedAt: new Date(), deletedBy: userId });
    },
};
