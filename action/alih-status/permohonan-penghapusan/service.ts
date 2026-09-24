import { AlihStatusPermohonanPenghapusanRepository } from "./repository";
import { db } from "@/drizzle";
import { AlihStatusPermohonanPenghapusanContract } from "./contract";
import { verifyPermissions } from "@/lib/auth/auth";
import { AlihStatusDataRepository } from "../data/repository";
import { AlihStatusBASTRepository } from "../bast/repository";
import { AlihStatusPermohonanRepository } from "../permohonan/repository";
import { AlihStatusBAPenelitianRepository } from "../ba-penelitian/repository";
import { AlihStatusNodinRepository } from "../nodin/repository";
import { AlihStatusPersetujuanBupatiRepository } from "../persetujuan-bupati/repository";

export const AlihStatusPermohonanPenghapusanService = {
    async getList(userId: string, tahun: number): Promise<AlihStatusPermohonanPenghapusanContract.SelectDTO[]> {
        await verifyPermissions(userId, {
            "alih-status": ["read"]
        });
        return AlihStatusPermohonanPenghapusanRepository.findAll(db, tahun);
    },
    async getDetailWithDetail(userId: string, id: number): Promise<AlihStatusPermohonanPenghapusanContract.SelectWithDetailDTO> {
        await verifyPermissions(userId, {
            "alih-status": ["read"]
        });
        const permohonanPenghapusan = await AlihStatusPermohonanPenghapusanRepository.findById(db, id);

        const data = await AlihStatusDataRepository.find(db, { permohonanPenghapusanId: [id] });

        const bastIds = [...new Set(data.map(e => e.bastId))].filter((id): id is number => id !== null && id !== undefined);
        const bast = await AlihStatusBASTRepository.findByIds(db, bastIds);

        const persetujuanBupatiId = [...new Set(data.map(e => e.persetujuanBupatiId))].filter((id): id is number => id !== null && id !== undefined);
        const persetujuanBupati = await AlihStatusPersetujuanBupatiRepository.findByIds(db, persetujuanBupatiId);

        const permohonanIds = [...new Set(data.map(e => e.permohonanId))].filter((id): id is number => id !== null && id !== undefined);
        const permohonan = await AlihStatusPermohonanRepository.findByIds(db, permohonanIds);

        const BAPenelitianIds = [...new Set(data.map(e => e.BAPenelitianId))].filter((id): id is number => id !== null && id !== undefined);
        const BAPenelitian = await AlihStatusBAPenelitianRepository.findByIds(db, BAPenelitianIds);

        const nodinIds = [...new Set(data.map(e => e.nodinId))].filter((id): id is number => id !== null && id !== undefined);
        const nodin = await AlihStatusNodinRepository.findByIds(db, nodinIds);
        return {
            permohonanPenghapusan,
            bast,
            persetujuanBupati,
            nodin,
            BAPenelitian,
            permohonan,
            data,
        };
    },
    async getForAvailablePermohonanPenghapusan(userId: string, tahun: number): Promise<AlihStatusPermohonanPenghapusanContract.SelectDTO[]> {
        await verifyPermissions(userId, {
            "alih-status": ["read"]
        });
        return AlihStatusPermohonanPenghapusanRepository.findForAvailableSKHapus(db, tahun);
    },
    async insert(data: AlihStatusPermohonanPenghapusanContract.InsertDTO, userId: string): Promise<AlihStatusPermohonanPenghapusanContract.SelectDTO> {
        await verifyPermissions(userId, {
            "alih-status": ["create"]
        });
        return await db.transaction(async tx => {
            const res = await AlihStatusPermohonanPenghapusanRepository.insert(db, { ...data, createdAt: new Date(), createdBy: userId });
            await AlihStatusDataRepository.link(tx, data.dataIds, { permohonanPenghapusanId: res.id })
            return res;
        })
    },

    async update(data: AlihStatusPermohonanPenghapusanContract.EditDTO, userId: string): Promise<AlihStatusPermohonanPenghapusanContract.SelectDTO> {
        await verifyPermissions(userId, {
            "alih-status": ["update"]
        });
        return await AlihStatusPermohonanPenghapusanRepository.update(db, { ...data, updatedAt: new Date(), updatedBy: userId });
    },

    async remove(data: AlihStatusPermohonanPenghapusanContract.DeleteDTO, userId: string): Promise<void> {
        await verifyPermissions(userId, {
            "alih-status": ["delete"]
        });
        await AlihStatusPermohonanPenghapusanRepository.remove(db, data);
    },
};
