// src/services/berkas.service.ts
import { randomUUID } from "node:crypto";
import { S3mini } from 's3mini';
import dotenv from 'dotenv';
dotenv.config();

const accessKeyId = process.env.S3_ACCESS_KEY;
const secretAccessKey = process.env.S3_SECRET_KEY;
const endpoint = process.env.S3_ENDPOINT;

if (!accessKeyId || !secretAccessKey || !endpoint) {
    throw new Error("S3 environment variables are not configured");
}

const s3 = new S3mini({
    accessKeyId,
    secretAccessKey,
    endpoint,
    region: "auto",
});

const DEFAULT_EXPIRES_SECONDS = 300;
const SEGMENT_REGEX = /^[a-zA-Z0-9_-]+$/;

const ALLOWED_EXTENSIONS = ["pdf", "jpg", "jpeg", "png", "xlsx"] as const;
export type BerkasExtension = (typeof ALLOWED_EXTENSIONS)[number];

/**
 * Scope = potongan path yang mengidentifikasi pemilik berkas.
 * Contoh: ["alih-status", "permohonan", 12]
 * -> prefix: "alih-status/permohonan/12/"
 */
export type BerkasScope = readonly (string | number)[];

function buildPrefix(scope: BerkasScope): string {
    if (scope.length === 0) {
        throw new Error("Scope berkas tidak boleh kosong");
    }
    for (const segment of scope) {
        if (!SEGMENT_REGEX.test(String(segment))) {
            throw new Error("Scope berkas tidak valid");
        }
    }
    return `${scope.join("/")}/`;
}

export const BerkasService = {
    buildPrefix,

    /** Buat key unik + presigned URL untuk upload (PUT) langsung dari client. */
    async generateUploadUrl(
        scope: BerkasScope,
        options: { extension?: BerkasExtension; expiresIn?: number } = {},
    ): Promise<{ url: string; key: string }> {
        const { extension = "pdf", expiresIn = DEFAULT_EXPIRES_SECONDS } =
            options;

        if (!ALLOWED_EXTENSIONS.includes(extension)) {
            throw new Error("Ekstensi berkas tidak diizinkan");
        }

        // Tanpa ":" dan karakter aneh; UUID mencegah tabrakan di ms yang sama
        const key = `${buildPrefix(scope)}${Date.now()}-${randomUUID()}.${extension}`;
        const url = await s3.getPresignedUrl("PUT", key, expiresIn);
        return { url, key };
    },

    /** Pastikan key milik scope tersebut (cegah client memasukkan key milik data lain). */
    assertKeyInScope(key: string, scope: BerkasScope): void {
        const prefix = buildPrefix(scope);
        if (!key.startsWith(prefix) || key.includes("..")) {
            throw new Error("Key berkas tidak valid");
        }
    },

    async assertExists(key: string): Promise<void> {
        const exists = await s3.objectExists(key);
        if (exists !== true) {
            throw new Error("Berkas tidak ditemukan di storage");
        }
    },

    /** Validasi key + cek keberadaan. Panggil SEBELUM transaksi DB. */
    async confirmUpload(key: string, scope: BerkasScope): Promise<void> {
        this.assertKeyInScope(key, scope);
        await this.assertExists(key);
    },

    /** Presigned URL untuk preview/download (GET). */
    async getPreviewUrl(
        key: string | null | undefined,
        expiresIn: number = DEFAULT_EXPIRES_SECONDS,
    ): Promise<string> {
        if (!key) {
            throw new Error("Berkas belum diunggah");
        }
        await this.assertExists(key);
        return s3.getPresignedUrl("GET", key, expiresIn);
    },

    /**
     * Presigned URL untuk UNDUH (GET) dengan `Content-Disposition: attachment`,
     * sehingga browser menyimpan berkas (mis. .xlsx) alih-alih mencoba menampilkannya.
     * `fileName` opsional; bila kosong dipakai nama dari key.
     */
    async getDownloadUrl(
        key: string | null | undefined,
        options: { fileName?: string; expiresIn?: number } = {},
    ): Promise<string> {
        if (!key) {
            throw new Error("Berkas belum diunggah");
        }
        await this.assertExists(key);

        const { expiresIn = DEFAULT_EXPIRES_SECONDS } = options;
        // Buang karakter yang bisa merusak header (kutip, backslash, kontrol, pemisah path).
        const fileName =
            (options.fileName ?? key.split("/").pop() ?? "berkas")
                .replace(/[\u0000-\u001f\u007f"\\/]/g, "_")
                .trim() || "berkas";

        const disposition = `attachment; filename="${fileName.replace(/[^\x20-\x7e]/g, "_")}"; filename*=UTF-8''${encodeURIComponent(fileName)}`;

        return s3.getPresignedUrl("GET", key, expiresIn, {
            "response-content-disposition": disposition,
        });
    },

    /**
     * Hapus objek setelah transaksi DB sukses. Best-effort: kalau gagal,
     * hanya di-log (data DB sudah konsisten, objek yatim bisa dibersihkan belakangan).
     */
    async deleteQuietly(key: string | null | undefined): Promise<void> {
        if (!key) return;
        try {
            await s3.deleteObject(key);
        } catch (error) {
            console.error("[BerkasService] Gagal menghapus objek:", key, error);
        }
    },

    /** Hapus key lama hanya jika berbeda dari key baru (untuk kasus replace). */
    async deleteReplaced(
        oldKey: string | null | undefined,
        newKey: string,
    ): Promise<void> {
        if (oldKey && oldKey !== newKey) {
            await this.deleteQuietly(oldKey);
        }
    },
};