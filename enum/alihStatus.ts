export const AlihStatusType = {
    PENGALIHAN_STATUS_PENGGUNAAN: "Pengalihan Status Penggunaan",
    PENGALIHAN_STATUS_PENGGUNAAN_DARI_PENGELOLA: "Pengalihan Status Penggunaan Dari Pengelola",
    PENYERAHAN_KEPADA_PENGELOLA: "Penyerahan Kepada Pengelola",
} as const;

export type AlihStatusType =
    typeof AlihStatusType[keyof typeof AlihStatusType];

export const AlihStatusTrackingSourceType = {
    ALIH_STATUS_PERMOHONAN: "Alih Status Permohonan",
    ALIH_STATUS_BA_PENELITIAN: "Alih Status BA Penelitian",
    ALIH_STATUS_NODIN: "Alih Status Nodin",
    ALIH_STATUS_PERSETUJUAN_BUPATI: "Alih Status Persetujuan Bupati",
    ALIH_STATUS_BAST: "Alih Status BAST",
    ALIH_STATUS_PERMOHONAN_PENGHAPUSAN: "Alih Status Permohonan Penghapusan",
    ALIH_STATUS_SK_HAPUS: "Alih Status SK Hapus",
} as const;

export type AlihStatusTrackingSourceType =
    typeof AlihStatusTrackingSourceType[keyof typeof AlihStatusTrackingSourceType];


export const AlihStatusTrackingPosition = {
    KASUBBID_PENATAUSAHAAN: "Kasubbid Penatausahaan - Merissa",
    KASUBBID_PENGAMANAN: "Kasubbid Pengamanan - Sulton",
    JF_KEUANGAN: "JF Keuangan - Yuni",
    KABID_PBMD: "Kabid PBMD - Dian",
    KABAN_BKAD: "Kaban BKAD - Yuswianto",
    ASISTEN_III: "Asisten III - Diana",
    SEKDA: "Sekda - Yudha",
    BUPATI: "Bupati - Rusdi",
    PENGGUNA_BARANG: "Pengguna Barang",
    PENGURUS_BARANG: "Pengurus Barang",
} as const;

export type AlihStatusTrackingPosition =
    typeof AlihStatusTrackingPosition[keyof typeof AlihStatusTrackingPosition];