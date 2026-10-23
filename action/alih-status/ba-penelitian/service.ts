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
import { BerkasService } from "@/action/berkas/berkas.service";
import { AlihStatusTrackingContract } from "../tracking/contract";
const BAPenelitianBerkasScope = (id: number) =>
    ["alih-status", "ba-penelitian", id] as const;

const today = () => new Date().toISOString().slice(0, 10);
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
            await AlihStatusTrackingRepository.create(tx, {
                date: new Date().toISOString().slice(0, 10),
                note: "Draft dibuat",
                position: "Staf PBMD",
                sourceType: AlihStatusTrackingSourceType.ALIH_STATUS_BA_PENELITIAN,
                sourceId: res.id,
                createdAt: new Date(),
                createdBy: userId,
            })
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
    async generatePresignedUrlBerkas(
        userId: string,
        id: number,
    ): Promise<{ url: string; key: string }> {
        await verifyPermissions(userId, { "alih-status": ["create"] });

        return BerkasService.generateUploadUrl(BAPenelitianBerkasScope(id), {
            extension: "pdf",
        });
    },

    async updateBerkas(
        userId: string,
        id: number,
        key: string,
    ): Promise<AlihStatusBAPenelitianContract.ResultAddBerkasDTO> {
        await verifyPermissions(userId, { "alih-status": ["create"] });

        // Validasi key milik data ini + objek benar-benar ada di storage
        await BerkasService.confirmUpload(key, BAPenelitianBerkasScope(id));

        const { tracking, oldKey }: { tracking: AlihStatusTrackingContract.SelectDTO, oldKey: string | null } = await db.transaction(async (tx) => {
            const baPenelitian = await AlihStatusBAPenelitianRepository.findById(tx, id);

            if (!baPenelitian) {
                throw new Error("BA Penelitian tidak ditemukan");
            }

            const previousKey = baPenelitian.keyBerkas;

            await AlihStatusBAPenelitianRepository.update(tx, {
                ...baPenelitian,
                keyBerkas: key,
                updatedAt: new Date(),
                updatedBy: userId,
            });

            const tracking = await AlihStatusTrackingRepository.create(tx, {
                date: today(),
                note: "Berita Acara Penelitian telah diunggah",
                position: "Staf PBMD",
                sourceType: AlihStatusTrackingSourceType.ALIH_STATUS_BA_PENELITIAN,
                sourceId: id,
                createdAt: new Date(),
                createdBy: userId,
            });

            return { tracking, oldKey: previousKey };
        });

        // Setelah commit: hapus file lama kalau diganti
        await BerkasService.deleteReplaced(oldKey, key);

        return { tracking, isDone: true };
    },

    async getPreviewUrlBerkas(userId: string, id: number): Promise<string> {
        await verifyPermissions(userId, { "alih-status": ["read"] });

        const row = await AlihStatusBAPenelitianRepository.findById(db, id);

        if (!row) {
            throw new Error("BA Penelitian tidak ditemukan");
        }

        // Melempar "Berkas belum diunggah" kalau key kosong,
        // dan "Berkas tidak ditemukan di storage" kalau objek hilang
        return BerkasService.getPreviewUrl(row.keyBerkas);
    },

    async deleteBerkas(userId: string, id: number): Promise<void> {
        await verifyPermissions(userId, { "alih-status": ["delete"] });

        const oldKey = await db.transaction(async (tx) => {
            const row = await AlihStatusBAPenelitianRepository.findById(tx, id);

            if (!row) {
                throw new Error("BA Penelitian tidak ditemukan");
            }

            if (!row.keyBerkas) {
                throw new Error("Berkas belum diunggah");
            }

            const previousKey = row.keyBerkas;

            await AlihStatusBAPenelitianRepository.update(tx, {
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
                sourceType: AlihStatusTrackingSourceType.ALIH_STATUS_BA_PENELITIAN,
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
