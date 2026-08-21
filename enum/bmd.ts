export const BmdAssetType = {
    TANAH: "tanah",
    // PERALATAN_DAN_MESIN: "peralatan_dan_mesin",
    // GEDUNG_DAN_BANGUNAN: "gedung_dan_bangunan",
    // JALAN_IRIGASI_DAN_JARINGAN: "jalan_irigasi_dan_jaringan",
    // ASET_TETAP_LAIN: "aset_tetap_lain",
    // KONTRUKSI_DALAM_PEKERJAAN: "kontruksi_dalam_pekerjaan",
    // KEMITRAAN_PIHAK_KETIGA: "kemitraan_pihak_ketiga",
    // ASET_TAK_BERWUJUD: "aset_tak_berwujud",
    // ASET_LAIN_LAIN: "aset_lain_lain",
    // PERSEDIAAN_RUSAK_BERAT_USANG: "persediaan_rusak_berat_usang",
    // ASET_BERSEJARAH: "aset_bersejarah",
} as const;

export type BmdAssetType =
    typeof BmdAssetType[keyof typeof BmdAssetType];

export const BmdAssetTypeCode: Record<BmdAssetType, number> = {
    [BmdAssetType.TANAH]: 1,
    // [BmdAssetType.PERALATAN_DAN_MESIN]: 2,
    // [BmdAssetType.GEDUNG_DAN_BANGUNAN]: 3,
    // [BmdAssetType.JALAN_IRIGASI_DAN_JARINGAN]: 4,
    // [BmdAssetType.ASET_TETAP_LAIN]: 5,
    // [BmdAssetType.KONTRUKSI_DALAM_PEKERJAAN]: 6,
    // [BmdAssetType.KEMITRAAN_PIHAK_KETIGA]: 7,
    // [BmdAssetType.ASET_TAK_BERWUJUD]: 8,
    // [BmdAssetType.ASET_LAIN_LAIN]: 9,
    // [BmdAssetType.PERSEDIAAN_RUSAK_BERAT_USANG]: 10,
    // [BmdAssetType.ASET_BERSEJARAH]: 11,
};

export const BmdAssetTypeFromCode: Record<number, BmdAssetType> = {
    1: BmdAssetType.TANAH,
    // 2: BmdAssetType.PERALATAN_DAN_MESIN,
    // 3: BmdAssetType.GEDUNG_DAN_BANGUNAN,
    // 4: BmdAssetType.JALAN_IRIGASI_DAN_JARINGAN,
    // 5: BmdAssetType.ASET_TETAP_LAIN,
    // 6: BmdAssetType.KONTRUKSI_DALAM_PEKERJAAN,
    // 7: BmdAssetType.KEMITRAAN_PIHAK_KETIGA,
    // 8: BmdAssetType.ASET_TAK_BERWUJUD,
    // 9: BmdAssetType.ASET_LAIN_LAIN,
    // 10: BmdAssetType.PERSEDIAAN_RUSAK_BERAT_USANG,
    // 11: BmdAssetType.ASET_BERSEJARAH,
};