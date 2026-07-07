import { BmdAssetType } from "@/enum/bmd";

export interface EbmdFetchParams {
    perangkatDaerahKodeLokasi: string;
    assetType: BmdAssetType;
}

export interface EbmdRow {
    nibar: string;
    nomorRegister: string;
    kodeBarang: string;
    namaBarang: string;
    spesifikasiNamaBarang: string;
    spesifikasiLainnya?: string | null;
    jumlah: number;
    satuan?: string | null;
    lokasi: string;
}

/**
 * TODO: implementasi asli — request ke eBMD lalu parsing Excel response
 * (bisa reuse pola dari xlsx-js-style/exceljs yang sudah dipakai di modul RKBMD).
 * Fungsi ini HARUS melempar error jika fetch/parsing gagal, agar retry mechanism
 * di service dapat menangkapnya.
 */
export async function fetchAndParseEbmd(params: EbmdFetchParams): Promise<EbmdRow[]> {
    throw new Error(
        `fetchAndParseEbmd belum diimplementasikan untuk ${params.perangkatDaerahKodeLokasi}/${params.assetType}`,
    );
}