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
import { AlihStatusTrackingRepository } from "../tracking/repository";
import { AlihStatusTrackingSourceType } from "@/enum/alihStatus";
import { BerkasService } from "@/action/berkas/berkas.service";
import { AlihStatusTrackingContract } from "../tracking/contract";
const PermohonanPenghapusanBerkasScope = (id: number) =>
    ["alih-status", "permohonan-penghapusan", id] as const;
const today = () => new Date().toISOString().slice(0, 10);

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

        const tracking = await AlihStatusTrackingRepository.findBySource(db, {
            sourceId: id,
            sourceType: AlihStatusTrackingSourceType.ALIH_STATUS_PERMOHONAN_PENGHAPUSAN
        })
        return {
            permohonanPenghapusan,
            bast,
            persetujuanBupati,
            nodin,
            BAPenelitian,
            permohonan,
            tracking,
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
            await AlihStatusTrackingRepository.create(tx, {
                date: new Date().toISOString().slice(0, 10),
                note: "Draft dibuat",
                position: "Staf PBMD",
                sourceType: AlihStatusTrackingSourceType.ALIH_STATUS_PERMOHONAN_PENGHAPUSAN,
                sourceId: res.id,
                createdAt: new Date(),
                createdBy: userId,
            })
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
    async generatePresignedUrlBerkas(
        userId: string,
        id: number,
    ): Promise<{ url: string; key: string }> {
        await verifyPermissions(userId, { "alih-status": ["create"] });

        return BerkasService.generateUploadUrl(PermohonanPenghapusanBerkasScope(id), {
            extension: "pdf",
        });
    },

    async updateBerkas(
        userId: string,
        permohonanPenghapusanId: number,
        key: string,
    ): Promise<AlihStatusPermohonanPenghapusanContract.ResultAddBerkasDTO> {
        await verifyPermissions(userId, { "alih-status": ["create"] });

        // Validasi key milik data ini + objek benar-benar ada di storage
        await BerkasService.confirmUpload(key, PermohonanPenghapusanBerkasScope(permohonanPenghapusanId));

        const { tracking, oldKey }: { tracking: AlihStatusTrackingContract.SelectDTO, oldKey: string | null } = await db.transaction(async (tx) => {
            const permohonanPenghapusan = await AlihStatusPermohonanPenghapusanRepository.findById(tx, permohonanPenghapusanId);

            if (!permohonanPenghapusan) {
                throw new Error("Permohonan Penghapusan tidak ditemukan");
            }

            const previousKey = permohonanPenghapusan.keyBerkas;

            await AlihStatusPermohonanPenghapusanRepository.update(tx, {
                ...permohonanPenghapusan,
                isDone: true,
                keyBerkas: key,
                updatedAt: new Date(),
                updatedBy: userId,
            });

            const tracking = await AlihStatusTrackingRepository.create(tx, {
                date: today(),
                note: "Permohonan Penghapusan telah diunggah",
                position: "Staf PBMD",
                sourceType: AlihStatusTrackingSourceType.ALIH_STATUS_PERMOHONAN_PENGHAPUSAN,
                sourceId: permohonanPenghapusanId,
                createdAt: new Date(),
                createdBy: userId,
            });

            return { tracking, oldKey: previousKey };
        });

        await BerkasService.deleteReplaced(oldKey, key);

        return { tracking, isDone: true };
    },

    async getPreviewUrlBerkas(userId: string, id: number): Promise<string> {
        await verifyPermissions(userId, { "alih-status": ["read"] });

        const row = await AlihStatusPermohonanPenghapusanRepository.findById(db, id);

        if (!row) {
            throw new Error("Permohonan Penghapusan tidak ditemukan");
        }

        // Melempar "Berkas belum diunggah" kalau key kosong,
        // dan "Berkas tidak ditemukan di storage" kalau objek hilang
        return BerkasService.getPreviewUrl(row.keyBerkas);
    },

    async deleteBerkas(userId: string, id: number): Promise<void> {
        await verifyPermissions(userId, { "alih-status": ["delete"] });

        const oldKey = await db.transaction(async (tx) => {
            const row = await AlihStatusPermohonanPenghapusanRepository.findById(tx, id);

            if (!row) {
                throw new Error("Permohonan Penghapusan tidak ditemukan");
            }

            if (!row.keyBerkas) {
                throw new Error("Berkas belum diunggah");
            }

            const previousKey = row.keyBerkas;

            await AlihStatusPermohonanPenghapusanRepository.update(tx, {
                ...row,
                isDone: false,
                keyBerkas: null,
                updatedAt: new Date(),
                updatedBy: userId,
            });

            await AlihStatusTrackingRepository.create(tx, {
                date: today(),
                note: "File dihapus",
                position: "Staf PBMD",
                sourceType: AlihStatusTrackingSourceType.ALIH_STATUS_PERMOHONAN_PENGHAPUSAN,
                sourceId: id,
                createdAt: new Date(),
                createdBy: userId,
            });

            return previousKey;
        });

        // Hapus objek di storage hanya setelah transaksi DB sukses,
        // supaya kalau transaksi gagal file tidak hilang.
        await BerkasService.deleteQuietly(oldKey);
    },
};
