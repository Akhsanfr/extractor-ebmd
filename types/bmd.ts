export type AsetType =
    | "tanah"
    | "peralatan_mesin"
    | "bangunan"
    | "jalan_irigasi_jaringan"
    | "aset_tetap_lain";

export interface BarangMerged {
    nomor: number;
    kodeBarang: string;
    namaBarang: string;
    jumlah: number;
    satuan: string;
}

export interface BarangAll extends BarangMerged {
    asetType: AsetType;
}

export type Barang = {
    kodeBarang: string;
    namaBarang: string;
    jumlah: number;
    satuan: string;
    asetType: AsetType;
}

export interface FormPemeliharaanData {
    kuasaPenggunaBarang: string;
    program: string;
    kegiatan: string;
    output: string;
    kodeBarang: string;
    namaBarang: string;
    jumlahTersedia: number;
    satuan: string;
    asetType: AsetType;
    namaPemeliharaan: string;
    jumlah: number;
}

export const ASET_LABEL: Record<AsetType, string> = {
    tanah: "Tanah",
    peralatan_mesin: "Peralatan dan Mesin",
    bangunan: "Bangunan",
    jalan_irigasi_jaringan: "Jalan, Irigasi, dan Jaringan",
    aset_tetap_lain: "Aset Tetap Lain",
};

export const ALL_ASET_TYPES = Object.keys(ASET_LABEL) as AsetType[];