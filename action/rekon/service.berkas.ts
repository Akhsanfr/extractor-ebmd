// -> src/action/rekon/service.berkas.ts
// File terpisah supaya service rekon yang sudah ada tidak perlu diubah.
import { db } from "@/drizzle";
import { OperationalError } from "@/action/actionResponse";
import { verifyPermissions } from "@/lib/auth/auth";
import { BerkasService } from "@/action/berkas/berkas.service";
import { RekonContract } from "./contract";
import { RekonRepository } from "./repository";

type Target = RekonContract.BerkasTargetDTO;

// Scope per (baris, tipe): key hasil upload hanya sah untuk baris dan dokumen ini,
// sehingga kertas kerja dan BA tidak bisa saling tertukar atau dipakai lintas baris.
const rekonBerkasScope = (id: number, tipe: RekonContract.BerkasTipe) =>
    ["rekon", id, tipe] as const;

const BERKAS_EXTENSION = { kertasKerja: "xlsx", ba: "pdf" } as const;
const BERKAS_LABEL = { kertasKerja: "Kertas kerja", ba: "Berita acara" } as const;

function keyPatch(tipe: RekonContract.BerkasTipe, key: string | null) {
    return tipe === "kertasKerja" ? { kertasKerjaId: key } : { baId: key };
}

function keyOf(row: { kertasKerjaId: string | null; baId: string | null }, tipe: RekonContract.BerkasTipe) {
    return tipe === "kertasKerja" ? row.kertasKerjaId : row.baId;
}

export const RekonBerkasService = {
    async generatePresignedUrl({ id, tipe }: Target): Promise<{ url: string; key: string }> {
        // await verifyPermissions(userId, { rekon: ["update"] });

        // Pastikan baris rekon benar-benar ada sebelum memberi izin upload
        // (findById melempar OperationalError bila tidak ditemukan).
        await RekonRepository.findById(db, id);

        return BerkasService.generateUploadUrl(rekonBerkasScope(id, tipe), {
            extension: BERKAS_EXTENSION[tipe], // ekstensi ditentukan server, bukan klien
        });
    },

    async updateBerkas(
        { id, tipe, key }: RekonContract.UpdateBerkasDTO,
    ): Promise<RekonContract.ResultBerkasDTO> {
        // await verifyPermissions(userId, { rekon: ["update"] });

        // Validasi key milik (baris, tipe) ini + objek benar-benar ada di storage.
        await BerkasService.confirmUpload(key, rekonBerkasScope(id, tipe));

        const { oldKey } = await db.transaction(async (tx) => {
            const row = await RekonRepository.findById(tx, id);

            // Hanya kolom milik `tipe` yang disentuh; dokumen lain dan nominal tetap utuh.
            await RekonRepository.updateBerkasKeys(tx, id, keyPatch(tipe, key));
            return { oldKey: keyOf(row, tipe) };
        });

        // Setelah commit: hapus file lama kalau diganti.
        await BerkasService.deleteReplaced(oldKey, key);

        return { id, tipe, key };
    },

    async getPreviewUrl({ id, tipe }: Target): Promise<string> {
        // await verifyPermissions(userId, { rekon: ["read"] });

        const row = await RekonRepository.findById(db, id);

        // Key dibaca dari DB, bukan dari klien.
        return BerkasService.getPreviewUrl(keyOf(row, tipe));
    },

    async getDownloadUrl({ id, tipe }: Target): Promise<string> {
        // await verifyPermissions(userId, { rekon: ["read"] });

        const row = await RekonRepository.findById(db, id);

        const key = keyOf(row, tipe);
        if (!key) throw new OperationalError(`${BERKAS_LABEL[tipe]} belum diunggah.`);

        // ASUMSI: BerkasService belum punya varian unduh. Lihat catatan di ringkasan.
        return BerkasService.getDownloadUrl(key);
    },

    async deleteBerkas({ id, tipe }: Target): Promise<void> {
        // await verifyPermissions(userId, { rekon: ["update"] });

        const oldKey = await db.transaction(async (tx) => {
            const row = await RekonRepository.findById(tx, id);

            const previousKey = keyOf(row, tipe);
            if (!previousKey) throw new OperationalError(`${BERKAS_LABEL[tipe]} belum diunggah.`);

            await RekonRepository.updateBerkasKeys(tx, id, keyPatch(tipe, null));
            return previousKey;
        });

        // Hapus objek di storage hanya setelah transaksi DB sukses.
        await BerkasService.deleteQuietly(oldKey);
    },
};