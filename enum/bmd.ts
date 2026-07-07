export const BmdAssetType = {
    TANAH: "tanah",
    PERALATAN_DAN_MESIN: "peralatan_dan_mesin",
    GEDUNG_DAN_BANGUNAN: "gedung_dan_bangunan",
    JALAN_IRIGASI_DAN_JARINGAN: "jalan_irigasi_dan_jaringan",
    ASET_TETAP_LAIN: "aset_tetap_lain",
    KONTRUKSI_DALAM_PEKERJAAN: "kontruksi_dalam_pekerjaan",
    KEMITRAAN_PIHAK_KETIGA: "kemitraan_pihak_ketiga",
    ASET_TAK_BERWUJUD: "aset_tak_berwujud",
    ASET_LAIN_LAIN: "aset_lain_lain",
    PERSEDIAAN_RUSAK_BERAT_USANG: "persediaan_rusak_berat_usang",
    ASET_BERSEJARAH: "aset_bersejarah",
} as const;

export type BmdAssetType =
    typeof BmdAssetType[keyof typeof BmdAssetType];