import { AlihStatusBASTRepository } from "./repository";
import { db } from "@/drizzle";
import { AlihStatusBASTContract } from "./contract";
import { verifyPermissions } from "@/lib/auth/auth";
import { AlihStatusDataRepository } from "../data/repository";
import { AlihStatusPermohonanRepository } from "../permohonan/repository";
import { AlihStatusBAPenelitianRepository } from "../ba-penelitian/repository";
import { AlihStatusNodinRepository } from "../nodin/repository";
import { AlihStatusPersetujuanBupatiRepository } from "../persetujuan-bupati/repository";
import { AlihStatusSpkmbRepository } from "../spkmb/repository";
import { OperationalError } from "@/action/actionResponse";
import { AlihStatusSPKMBContract } from "../spkmb/contract";
import { AlihStatusTrackingRepository } from "../tracking/repository";
import { AlihStatusTrackingSourceType } from "@/enum/alihStatus";

export const AlihStatusBASTService = {
    async getList(userId: string, tahun: number): Promise<AlihStatusBASTContract.SelectDTO[]> {
        await verifyPermissions(userId, {
            "alih-status": ["read"]
        });
        return AlihStatusBASTRepository.findAll(db, tahun);
    },
    async getDetailWithDetail(userId: string, id: number): Promise<AlihStatusBASTContract.SelectWithDetailDTO> {
        await verifyPermissions(userId, {
            "alih-status": ["read"]
        });
        const bast = await AlihStatusBASTRepository.findById(db, id);

        const data = await AlihStatusDataRepository.find(db, { bastId: [id] });

        const persetujuanBupatiId = [...new Set(data.map(e => e.persetujuanBupatiId))].filter((id): id is number => id !== null && id !== undefined);
        const persetujuanBupati = await AlihStatusPersetujuanBupatiRepository.findByIds(db, persetujuanBupatiId);

        const permohonanIds = [...new Set(data.map(e => e.permohonanId))].filter((id): id is number => id !== null && id !== undefined);
        const permohonan = await AlihStatusPermohonanRepository.findByIds(db, permohonanIds);

        const BAPenelitianIds = [...new Set(data.map(e => e.BAPenelitianId))].filter((id): id is number => id !== null && id !== undefined);
        const BAPenelitian = await AlihStatusBAPenelitianRepository.findByIds(db, BAPenelitianIds);

        const nodinIds = [...new Set(data.map(e => e.nodinId))].filter((id): id is number => id !== null && id !== undefined);
        const nodin = await AlihStatusNodinRepository.findByIds(db, nodinIds);

        const tracking = await AlihStatusTrackingRepository.findBySource(db, {
            sourceId: id,
            sourceType: AlihStatusTrackingSourceType.ALIH_STATUS_BAST
        })
        return {
            tracking,
            persetujuanBupati,
            permohonan,
            data,
            BAPenelitian,
            nodin,
            bast
        };
    },
    async getForAvailablePermohonanPenghapusan(userId: string, tahun: number): Promise<AlihStatusBASTContract.SelectDTO[]> {
        await verifyPermissions(userId, {
            "alih-status": ["read"]
        });
        return AlihStatusBASTRepository.findForAvailablePermohonanPenghapusan(db, tahun);
    },

    async insert(data: AlihStatusBASTContract.InsertDTO, userId: string): Promise<AlihStatusBASTContract.SelectDTO> {
        await verifyPermissions(userId, {
            "alih-status": ["create"]
        });
        return await db.transaction(async tx => {
            const res = await AlihStatusBASTRepository.insert(db, { ...data, createdAt: new Date(), createdBy: userId });
            await AlihStatusDataRepository.link(tx, data.dataIds, { bastId: res.id })
            return res;
        })
    },

    async update(data: AlihStatusBASTContract.EditDTO, userId: string): Promise<AlihStatusBASTContract.SelectDTO> {
        await verifyPermissions(userId, {
            "alih-status": ["update"]
        });
        return await AlihStatusBASTRepository.update(db, { ...data, updatedAt: new Date(), updatedBy: userId });
    },

    async remove(data: AlihStatusBASTContract.DeleteDTO, userId: string): Promise<void> {
        await verifyPermissions(userId, {
            "alih-status": ["delete"]
        });
        await AlihStatusBASTRepository.remove(db, data);
    },

    async getPenggunaBarang(userId: string, permohonanId: number, spkmbId: number): Promise<AlihStatusBASTContract.PenggunaBarangDTO> {
        await verifyPermissions(userId, {
            "alih-status": ["read"]
        });
        const spkmb = await AlihStatusSpkmbRepository.findByIds(db, [spkmbId]);
        const permohonan = await AlihStatusPermohonanRepository.findByIds(db, [permohonanId]);
        if (spkmb.length === 0) throw new OperationalError("Gagal memuat data SPKMB")
        if (permohonan.length === 0) throw new OperationalError("Gagal memuat data Permohonan")
        return {
            tujuan: {
                nama: spkmb[0].penggunaBarangTujuanNama,
                pangkat: spkmb[0].penggunaBarangTujuanPangkat,
                nip: spkmb[0].penggunaBarangTujuanNIP,
                jabatan: spkmb[0].penggunaBarangTujuanJabatan,
            },
            asal: {
                nama: permohonan[0].penggunaBarangAsalNama,
                pangkat: permohonan[0].penggunaBarangAsalPangkat,
                nip: permohonan[0].penggunaBarangAsalNIP,
                jabatan: permohonan[0].penggunaBarangAsalJabatan,
            }
        }
    }
};
