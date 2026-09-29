import { AlihStatusSKHapusRepository } from "./repository";
import { db } from "@/drizzle";
import { AlihStatusSKHapusContract } from "./contract";
import { verifyPermissions } from "@/lib/auth/auth";
import { AlihStatusDataRepository } from "../data/repository";
import { AlihStatusPermohonanPenghapusanRepository } from "../permohonan-penghapusan/repository";
import { AlihStatusBASTRepository } from "../bast/repository";
import { AlihStatusPersetujuanBupatiRepository } from "../persetujuan-bupati/repository";
import { AlihStatusPermohonanRepository } from "../permohonan/repository";
import { AlihStatusNodinRepository } from "../nodin/repository";
import { AlihStatusBAPenelitianRepository } from "../ba-penelitian/repository";
import { AlihStatusTrackingRepository } from "../tracking/repository";
import { AlihStatusTrackingSourceType } from "@/enum/alihStatus";

export const AlihStatusSKHapusService = {
    async getList(userId: string, tahun: number): Promise<AlihStatusSKHapusContract.SelectDTO[]> {
        await verifyPermissions(userId, {
            "alih-status": ["read"]
        });
        return AlihStatusSKHapusRepository.findAll(db, tahun);
    },
    async getDetailWithDetail(userId: string, id: number): Promise<AlihStatusSKHapusContract.SelectWithDetailDTO> {
        await verifyPermissions(userId, {
            "alih-status": ["read"]
        });
        const SKHapus = await AlihStatusSKHapusRepository.findById(db, id);


        const data = await AlihStatusDataRepository.find(db, { SKHapusId: [id] });

        const permohonanPenghapusanIds = [...new Set(data.map(e => e.permohonanPenghapusanId))].filter((id): id is number => id !== null && id !== undefined);
        const permohonanPenghapusan = await AlihStatusPermohonanPenghapusanRepository.findByIds(db, permohonanPenghapusanIds);

        const bastIds = [...new Set(data.map(e => e.bastId))].filter((id): id is number => id !== null && id !== undefined);
        const bast = await AlihStatusBASTRepository.findByIds(db, bastIds);

        const persetujuanBupatiId = [...new Set(data.map(e => e.persetujuanBupatiId))].filter((id): id is number => id !== null && id !== undefined);
        const persetujuanBupati = await AlihStatusPersetujuanBupatiRepository.findByIds(db, persetujuanBupatiId);

        const nodinIds = [...new Set(data.map(e => e.nodinId))].filter((id): id is number => id !== null && id !== undefined);
        const nodin = await AlihStatusNodinRepository.findByIds(db, nodinIds);

        const BAPenelitianIds = [...new Set(data.map(e => e.BAPenelitianId))].filter((id): id is number => id !== null && id !== undefined);
        const BAPenelitian = await AlihStatusBAPenelitianRepository.findByIds(db, BAPenelitianIds);

        const permohonanIds = [...new Set(data.map(e => e.permohonanId))].filter((id): id is number => id !== null && id !== undefined);
        const permohonan = await AlihStatusPermohonanRepository.findByIds(db, permohonanIds);

        const tracking = await AlihStatusTrackingRepository.findBySource(db, {
            sourceId: id,
            sourceType: AlihStatusTrackingSourceType.ALIH_STATUS_SK_HAPUS
        })

        return {
            tracking,
            SKHapus,
            permohonanPenghapusan,
            bast,
            persetujuanBupati,
            nodin,
            BAPenelitian,
            permohonan,
            data,
        };
    },


    async insert(data: AlihStatusSKHapusContract.CreateDTO, userId: string): Promise<AlihStatusSKHapusContract.SelectDTO> {
        await verifyPermissions(userId, {
            "alih-status": ["create"]
        });
        return await db.transaction(async tx => {
            const res = await AlihStatusSKHapusRepository.insert(db, { ...data, createdAt: new Date(), createdBy: userId });
            await AlihStatusDataRepository.link(tx, data.dataIds, { SKHapusId: res.id })
            return res;
        })
    },

    async update(data: AlihStatusSKHapusContract.EditDTO, userId: string): Promise<AlihStatusSKHapusContract.SelectDTO> {
        await verifyPermissions(userId, {
            "alih-status": ["update"]
        });
        return await AlihStatusSKHapusRepository.update(db, { ...data, updatedAt: new Date(), updatedBy: userId });
    },

    async remove(data: AlihStatusSKHapusContract.DeleteDTO, userId: string): Promise<void> {
        await verifyPermissions(userId, {
            "alih-status": ["delete"]
        });
        await AlihStatusSKHapusRepository.remove(db, data)
    }
};
