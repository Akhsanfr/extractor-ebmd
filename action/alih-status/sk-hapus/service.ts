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
import { BerkasService } from "@/action/berkas/berkas.service";
import { AlihStatusTrackingContract } from "../tracking/contract";
const SKHapusBerkasScope = (id: number) =>
    ["alih-status", "sk-hapus", id] as const;
const today = () => new Date().toISOString().slice(0, 10);


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
            await AlihStatusTrackingRepository.create(tx, {
                date: new Date().toISOString().slice(0, 10),
                note: "Draft dibuat",
                position: "Staf PBMD",
                sourceType: AlihStatusTrackingSourceType.ALIH_STATUS_SK_HAPUS,
                sourceId: res.id,
                createdAt: new Date(),
                createdBy: userId,
            })
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
    },
    async generatePresignedUrlBerkas(
        userId: string,
        id: number,
    ): Promise<{ url: string; key: string }> {
        await verifyPermissions(userId, { "alih-status": ["create"] });

        return BerkasService.generateUploadUrl(SKHapusBerkasScope(id), {
            extension: "pdf",
        });
    },

    async updateBerkas(
        userId: string,
        SKHapusId: number,
        key: string,
    ): Promise<AlihStatusSKHapusContract.ResultAddBerkasDTO> {
        await verifyPermissions(userId, { "alih-status": ["create"] });

        // Validasi key milik data ini + objek benar-benar ada di storage
        await BerkasService.confirmUpload(key, SKHapusBerkasScope(SKHapusId));

        const { tracking, oldKey }: { tracking: AlihStatusTrackingContract.SelectDTO, oldKey: string | null } = await db.transaction(async (tx) => {
            const skHapus = await AlihStatusSKHapusRepository.findById(tx, SKHapusId);

            if (!skHapus) {
                throw new Error("SK Penghapusan tidak ditemukan");
            }

            const previousKey = skHapus.keyBerkas;

            await AlihStatusSKHapusRepository.update(tx, {
                ...skHapus,
                isDone: true,
                keyBerkas: key,
                updatedAt: new Date(),
                updatedBy: userId,
            });

            const tracking = await AlihStatusTrackingRepository.create(tx, {
                date: today(),
                note: "SK Penghapusan telah diunggah",
                position: "Staf PBMD",
                sourceType: AlihStatusTrackingSourceType.ALIH_STATUS_SK_HAPUS,
                sourceId: SKHapusId,
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

        const row = await AlihStatusSKHapusRepository.findById(db, id);

        if (!row) {
            throw new Error("SK Hapus tidak ditemukan");
        }

        // Melempar "Berkas belum diunggah" kalau key kosong,
        // dan "Berkas tidak ditemukan di storage" kalau objek hilang
        return BerkasService.getPreviewUrl(row.keyBerkas);
    },

    async deleteBerkas(userId: string, id: number): Promise<void> {
        await verifyPermissions(userId, { "alih-status": ["delete"] });

        const oldKey = await db.transaction(async (tx) => {
            const row = await AlihStatusSKHapusRepository.findById(tx, id);

            if (!row) {
                throw new Error("SK Hapus tidak ditemukan");
            }

            if (!row.keyBerkas) {
                throw new Error("Berkas belum diunggah");
            }

            const previousKey = row.keyBerkas;

            await AlihStatusSKHapusRepository.update(tx, {
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
                sourceType: AlihStatusTrackingSourceType.ALIH_STATUS_SK_HAPUS,
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
