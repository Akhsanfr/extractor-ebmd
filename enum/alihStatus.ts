export const AlihStatusType = {
    PENGALIHAN_STATUS_PENGGUNAAN: "Pengalihan Status Penggunaan",
    PENGALIHAN_STATUS_PENGGUNAAN_DARI_PENGELOLA: "Pengalihan Status Penggunaan Dari Pengelola",
    PENYERAHAN_KEPADA_PENGELOLA: "Penyerahan Kepada Pengelola",
} as const;

export type AlihStatusType =
    typeof AlihStatusType[keyof typeof AlihStatusType];