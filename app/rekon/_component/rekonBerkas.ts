import { FileSpreadsheet, FileText, type LucideIcon } from "lucide-react";
import type { RekonRow } from "./rekonUtil";

// Jenis dokumen yang dikelola per baris rekon. Keduanya independen satu sama lain.
export type RekonBerkasTipe = "kertasKerja" | "ba";

export const REKON_BERKAS_TIPE: readonly RekonBerkasTipe[] = ["kertasKerja", "ba"] as const;

type BerkasConfig = {
    label: string; // judul modal
    short: string; // label kolom / tombol
    icon: LucideIcon;
    accept: string; // MIME type untuk dropzone
    extLabel: string;
    maxSizeMB: number; // satu tempat untuk mengubah batas ukuran
    downloadLabel: string;
};

export const REKON_BERKAS_CONFIG: Record<RekonBerkasTipe, BerkasConfig> = {
    kertasKerja: {
        label: "Kertas Kerja Rekonsiliasi",
        short: "Kertas Kerja",
        icon: FileSpreadsheet,
        accept: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        extLabel: ".xlsx",
        maxSizeMB: 10,
        downloadLabel: "Download Excel",
    },
    ba: {
        label: "Berita Acara Rekonsiliasi",
        short: "Berita Acara",
        icon: FileText,
        accept: "application/pdf",
        extLabel: ".pdf",
        maxSizeMB: 10,
        downloadLabel: "Download PDF",
    },
};

// Key object storage yang tersimpan di baris rekon (null = belum ada).
export function getBerkasKey(row: RekonRow, tipe: RekonBerkasTipe): string | null {
    return (tipe === "kertasKerja" ? row.kertasKerjaId : row.baId) ?? null;
}

// Hanya field milik `tipe` yang berubah; dokumen lain dan nominal tetap utuh.
export function withBerkasKey(row: RekonRow, tipe: RekonBerkasTipe, key: string | null): RekonRow {
    return tipe === "kertasKerja" ? { ...row, kertasKerjaId: key } : { ...row, baId: key };
}

export function getBerkasFileName(key: string | null): string | null {
    return key?.split("/").pop() ?? null;
}