export const PerangkatDaerahJabatan = {
    PENGGUNA: "pengguna barang",
    KUASA_PENGGUNA: "kuasa pengguna barang",
    SUB_KUASA_PENGGUNA: "sub kuasa pengguna barang",
} as const;

export type PerangkatDaerahJabatan =
    typeof PerangkatDaerahJabatan[keyof typeof PerangkatDaerahJabatan];