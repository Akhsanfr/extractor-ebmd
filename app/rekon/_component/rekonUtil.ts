import Decimal from "decimal.js";
import { RekonContract } from "@/action/rekon/contract";
import { RekonType } from "@/enum/rekon";

export type RekonRow = RekonContract.SelectWithPerangkatDaerahDTO;

// Kunci dasar semua query rekon. Daftar: [...REKON_QUERY_KEY, tahun, bulan, rekonType].
export const REKON_QUERY_KEY = ["rekon"] as const;

export const TAHUN_AWAL = 2026;

export const REKON_TYPE_LABEL: Record<RekonType, string> = {
    asetTetap: "Aset Tetap",
    persediaan: "Persediaan",
    pemeliharaan: "Pemeliharaan",
};

export const BULAN_LABEL = [
    "Januari",
    "Februari",
    "Maret",
    "April",
    "Mei",
    "Juni",
    "Juli",
    "Agustus",
    "September",
    "Oktober",
    "November",
    "Desember",
] as const;

// Tahun dari TAHUN_AWAL sampai tahun berjalan (urut naik).
export function getTahunOptions(now: Date = new Date()): number[] {
    const length = Math.max(0, now.getFullYear() - TAHUN_AWAL + 1);
    return Array.from({ length }, (_, i) => TAHUN_AWAL + i);
}

export function isRekonType(key: unknown): key is RekonType {
    return Object.values(RekonType).some((type) => type === key);
}

// Kurang/Lebih = Realisasi Anggaran - Input BMD
export function hitungSelisih(row: Pick<RekonRow, "realisasiAnggaran" | "inputBMD">): Decimal {
    return new Decimal(row.realisasiAnggaran).minus(row.inputBMD);
}

// Persentase = Input BMD / Realisasi Anggaran x 100. null jika realisasi 0 (tidak bisa dihitung).
export function hitungPersentase(row: Pick<RekonRow, "realisasiAnggaran" | "inputBMD">): Decimal | null {
    const realisasi = new Decimal(row.realisasiAnggaran);
    if (realisasi.isZero()) return null;
    return new Decimal(row.inputBMD).div(realisasi).times(100);
}

const rupiahFormat = new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
});

export function formatRupiah(value: Decimal | number): string {
    return rupiahFormat.format(value instanceof Decimal ? value.toNumber() : value);
}

export function formatPersentase(value: Decimal | null): string {
    return value === null ? "—" : `${value.toFixed(2).replace(".", ",")}%`;
}

// Input nominal gaya Indonesia: titik = pemisah ribuan (diabaikan), koma = desimal.
export function parseNominalInput(raw: string): number | null {
    const cleaned = raw.trim().replace(/[^\d,-]/g, "").replace(",", ".");
    if (cleaned === "" || cleaned === "-") return null;
    const value = Number(cleaned);
    return Number.isFinite(value) ? value : null;
}

export function nominalToInput(value: number): string {
    return String(value).replace(".", ",");
}

export function getErrorMessage(error: unknown, fallback = "Terjadi kesalahan"): string {
    if (error instanceof Error) return error.message;
    if (typeof error === "string") return error;
    if (
        typeof error === "object" &&
        error !== null &&
        "message" in error &&
        typeof error.message === "string"
    ) {
        return error.message;
    }
    return fallback;
}
