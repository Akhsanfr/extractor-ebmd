import { AlihStatusPermohonanRepository } from "./repository";
import { db } from "@/drizzle";
import { AlihStatusPermohonanContract } from "./contract";
import { verifyPermissions } from "@/lib/auth/auth";
import { AlihStatusSpkmbRepository } from "../spkmb/repository";
import { AlihStatusDataRepository } from "../data/repository";
import { AlihStatusTrackingRepository } from "../tracking/repository";
import { AlihStatusTrackingSourceType } from "@/enum/alihStatus";
import { BerkasService } from "@/action/berkas/berkas.service";
import { AlihStatusTrackingContract } from "../tracking/contract";
const berkasScope = (permohonanId: number) =>
    ["alih-status", "permohonan", permohonanId] as const;

const today = () => new Date().toISOString().slice(0, 10);


export const AlihStatusPermohonanService = {
    async get(userId: string, id: number): Promise<AlihStatusPermohonanContract.SelectDTO> {
        await verifyPermissions(userId, {
            "alih-status": ["read"]
        });
        return AlihStatusPermohonanRepository.findById(db, id);
    },
    async getList(userId: string, query: AlihStatusPermohonanContract.QueryDTO): Promise<AlihStatusPermohonanContract.SelectDTO[]> {
        await verifyPermissions(userId, {
            "alih-status": ["read"]
        });
        return AlihStatusPermohonanRepository.find(db, query);
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
        return await db.transaction(async tx => {
            const res = await AlihStatusPermohonanRepository.insert(tx, { ...data, createdAt: new Date(), createdBy: userId });
            await AlihStatusTrackingRepository.create(tx, {
                date: new Date().toISOString().slice(0, 10),
                note: "Draft dibuat",
                position: "Staf PBMD",
                sourceType: AlihStatusTrackingSourceType.ALIH_STATUS_PERMOHONAN,
                sourceId: res.id,
                createdAt: new Date(),
                createdBy: userId,
            })
            return res;
        })
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

    async generatePresignedUrlBerkas(
        userId: string,
        permohonanId: number,
    ): Promise<{ url: string; key: string }> {
        await verifyPermissions(userId, { "alih-status": ["create"] });

        return BerkasService.generateUploadUrl(berkasScope(permohonanId), {
            extension: "pdf",
        });
    },

    async updateBerkas(
        userId: string,
        permohonanId: number,
        key: string,
    ): Promise<AlihStatusPermohonanContract.ResultAddBerkasDTO> {
        await verifyPermissions(userId, { "alih-status": ["create"] });
        await BerkasService.confirmUpload(key, berkasScope(permohonanId));
        const { tracking, oldKey }: { tracking: AlihStatusTrackingContract.SelectDTO, oldKey: string | null } = await db.transaction(async (tx) => {
            const permohonan = await AlihStatusPermohonanRepository.findById(
                tx,
                permohonanId,
            );

            if (!permohonan) {
                throw new Error("Permohonan tidak ditemukan");
            }

            const previousKey = permohonan.keyBerkas;

            await AlihStatusPermohonanRepository.update(tx, {
                ...permohonan,
                isDone: true,
                keyBerkas: key,
                updatedAt: new Date(),
                updatedBy: userId,
            });

            const tracking = await AlihStatusTrackingRepository.create(tx, {
                date: today(),
                note: "Dokumen telah diarsipkan",
                position: "Staf PBMD",
                sourceType: AlihStatusTrackingSourceType.ALIH_STATUS_PERMOHONAN,
                sourceId: permohonanId,
                createdAt: new Date(),
                createdBy: userId,
            });

            return { tracking, oldKey: previousKey };
        });

        // Setelah commit: hapus file lama kalau diganti
        await BerkasService.deleteReplaced(oldKey, key);

        return {
            tracking,
            isDone: true
        };
    },

    async getPreviewUrlBerkas(
        userId: string,
        permohonanId: number,
    ): Promise<string> {
        await verifyPermissions(userId, { "alih-status": ["read"] });

        const permohonan = await AlihStatusPermohonanRepository.findById(
            db,
            permohonanId,
        );

        if (!permohonan) {
            throw new Error("Permohonan tidak ditemukan");
        }

        // Melempar "Berkas belum diunggah" kalau key kosong,
        // dan "Berkas tidak ditemukan di storage" kalau objek hilang
        return BerkasService.getPreviewUrl(permohonan.keyBerkas);
    },

    async deleteBerkas(userId: string, permohonanId: number): Promise<void> {
        await verifyPermissions(userId, { "alih-status": ["delete"] });

        const oldKey = await db.transaction(async (tx) => {
            const permohonan = await AlihStatusPermohonanRepository.findById(
                tx,
                permohonanId,
            );

            if (!permohonan) {
                throw new Error("Permohonan tidak ditemukan");
            }

            if (!permohonan.keyBerkas) {
                throw new Error("Berkas belum diunggah");
            }

            const previousKey = permohonan.keyBerkas;

            await AlihStatusPermohonanRepository.update(tx, {
                ...permohonan,
                isDone: false,
                keyBerkas: null,
                updatedAt: new Date(),
                updatedBy: userId,
            });

            await AlihStatusTrackingRepository.create(tx, {
                date: today(),
                note: "File dihapus",
                position: "Staf PBMD",
                sourceType: AlihStatusTrackingSourceType.ALIH_STATUS_PERMOHONAN,
                sourceId: permohonanId,
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
