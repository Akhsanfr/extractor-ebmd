import { AlihStatusPersetujuanBupatiRepository } from "./repository";
import { db } from "@/drizzle";
import { AlihStatusPersetujuanBupatiContract } from "./contract";
import { verifyPermissions } from "@/lib/auth/auth";
import { AlihStatusDataRepository } from "../data/repository";
import { AlihStatusPermohonanRepository } from "../permohonan/repository";
import { AlihStatusBAPenelitianRepository } from "../ba-penelitian/repository";
import { AlihStatusNodinRepository } from "../nodin/repository";
import { AlihStatusTrackingRepository } from "../tracking/repository";
import { AlihStatusTrackingSourceType } from "@/enum/alihStatus";
import { BerkasService } from "@/action/berkas/berkas.service";
import { AlihStatusTrackingContract } from "../tracking/contract";
const persetujuanBupatiBerkasScope = (id: number) =>
    ["alih-status", "persetujuan-bupati", id] as const;
const today = () => new Date().toISOString().slice(0, 10);

export const AlihStatusPersetujuanBupatiService = {
    async getList(userId: string, tahun: number): Promise<AlihStatusPersetujuanBupatiContract.SelectDTO[]> {
        await verifyPermissions(userId, {
            "alih-status": ["read"]
        });
        return AlihStatusPersetujuanBupatiRepository.findAll(db, tahun);
    },
    async getDetailWithDetail(userId: string, id: number): Promise<AlihStatusPersetujuanBupatiContract.SelectWithDetailDTO> {
        await verifyPermissions(userId, {
            "alih-status": ["read"]
        });


        const persetujuanBupati = await AlihStatusPersetujuanBupatiRepository.findById(db, id);

        const data = await AlihStatusDataRepository.find(db, { persetujuanBupatiId: [id] });

        const permohonanIds = [...new Set(data.map(e => e.permohonanId))].filter((id): id is number => id !== null && id !== undefined);
        const permohonan = await AlihStatusPermohonanRepository.findByIds(db, permohonanIds);

        const BAPenelitianIds = [...new Set(data.map(e => e.BAPenelitianId))].filter((id): id is number => id !== null && id !== undefined);
        const BAPenelitian = await AlihStatusBAPenelitianRepository.findByIds(db, BAPenelitianIds);

        const nodinIds = [...new Set(data.map(e => e.nodinId))].filter((id): id is number => id !== null && id !== undefined);
        const nodin = await AlihStatusNodinRepository.findByIds(db, nodinIds);

        const tracking = await AlihStatusTrackingRepository.findBySource(db, {
            sourceId: id,
            sourceType: AlihStatusTrackingSourceType.ALIH_STATUS_PERSETUJUAN_BUPATI
        })
        return {
            tracking,
            persetujuanBupati,
            permohonan,
            data,
            BAPenelitian,
            nodin
        };
    },
    async getForAvailableBAST(userId: string, tahun: number): Promise<AlihStatusPersetujuanBupatiContract.SelectDTO[]> {
        await verifyPermissions(userId, {
            "alih-status": ["read"]
        });
        return AlihStatusPersetujuanBupatiRepository.findForAvailableBAST(db, tahun);
    },
    async insert(data: AlihStatusPersetujuanBupatiContract.CreateDTO, userId: string): Promise<AlihStatusPersetujuanBupatiContract.SelectDTO> {
        await verifyPermissions(userId, {
            "alih-status": ["create"]
        });
        return await db.transaction(async tx => {
            const res = await AlihStatusPersetujuanBupatiRepository.insert(tx, { ...data, createdAt: new Date(), createdBy: userId });
            await AlihStatusDataRepository.link(tx, data.dataIds, { persetujuanBupatiId: res.id })
            await AlihStatusTrackingRepository.create(tx, {
                date: new Date().toISOString().slice(0, 10),
                note: "Draft dibuat",
                position: "Staf PBMD",
                sourceType: AlihStatusTrackingSourceType.ALIH_STATUS_PERSETUJUAN_BUPATI,
                sourceId: res.id,
                createdAt: new Date(),
                createdBy: userId,
            })
            return res;
        })
    },

    async update(data: AlihStatusPersetujuanBupatiContract.EditDTO, userId: string): Promise<AlihStatusPersetujuanBupatiContract.SelectDTO> {
        await verifyPermissions(userId, {
            "alih-status": ["update"]
        });
        return await AlihStatusPersetujuanBupatiRepository.update(db, { ...data, updatedAt: new Date(), updatedBy: userId });
    },

    async remove(data: AlihStatusPersetujuanBupatiContract.DeleteDTO, userId: string): Promise<void> {
        await verifyPermissions(userId, {
            "alih-status": ["delete"]
        });
        await AlihStatusPersetujuanBupatiRepository.remove(db, data);
    },
    async generatePresignedUrlBerkas(
        userId: string,
        id: number,
    ): Promise<{ url: string; key: string }> {
        await verifyPermissions(userId, { "alih-status": ["create"] });

        return BerkasService.generateUploadUrl(persetujuanBupatiBerkasScope(id), {
            extension: "pdf",
        });
    },

    async updateBerkas(
        userId: string,
        persetujuanBupatiId: number,
        key: string,
    ): Promise<AlihStatusPersetujuanBupatiContract.ResultAddBerkasDTO> {
        await verifyPermissions(userId, { "alih-status": ["create"] });

        // Validasi key milik data ini + objek benar-benar ada di storage
        await BerkasService.confirmUpload(key, persetujuanBupatiBerkasScope(persetujuanBupatiId));

        const { tracking, oldKey }: { tracking: AlihStatusTrackingContract.SelectDTO, oldKey: string | null } = await db.transaction(async (tx) => {
            const persetujuanBupati = await AlihStatusPersetujuanBupatiRepository.findById(tx, persetujuanBupatiId);

            if (!persetujuanBupati) {
                throw new Error("Persetujuan Bupati tidak ditemukan");
            }

            const previousKey = persetujuanBupati.keyBerkas;

            await AlihStatusPersetujuanBupatiRepository.update(tx, {
                ...persetujuanBupati,
                keyBerkas: key,
                updatedAt: new Date(),
                updatedBy: userId,
            });

            const tracking = await AlihStatusTrackingRepository.create(tx, {
                date: today(),
                note: "Persetujuan Bupati telah diunggah",
                position: "Bupati",
                sourceType: AlihStatusTrackingSourceType.ALIH_STATUS_PERSETUJUAN_BUPATI,
                sourceId: persetujuanBupatiId,
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

        const row = await AlihStatusPersetujuanBupatiRepository.findById(db, id);

        if (!row) {
            throw new Error("Persetujuan Bupati tidak ditemukan");
        }

        // Melempar "Berkas belum diunggah" kalau key kosong,
        // dan "Berkas tidak ditemukan di storage" kalau objek hilang
        return BerkasService.getPreviewUrl(row.keyBerkas);
    },

    async deleteBerkas(userId: string, id: number): Promise<void> {
        await verifyPermissions(userId, { "alih-status": ["delete"] });

        const oldKey = await db.transaction(async (tx) => {
            const row = await AlihStatusPersetujuanBupatiRepository.findById(tx, id);

            if (!row) {
                throw new Error("Persetujuan Bupati tidak ditemukan");
            }

            if (!row.keyBerkas) {
                throw new Error("Berkas belum diunggah");
            }

            const previousKey = row.keyBerkas;

            await AlihStatusPersetujuanBupatiRepository.update(tx, {
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
                sourceType: AlihStatusTrackingSourceType.ALIH_STATUS_PERSETUJUAN_BUPATI,
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
