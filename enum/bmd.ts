export const BmdAssetType = {
    TANAH: "Tanah",
    PERALATAN_DAN_MESIN: "Peralatan Dan Mesin",
    GEDUNG_DAN_BANGUNAN: "Gedung Dan Bangunan",
    JALAN_IRIGASI_DAN_JARINGAN: "Jalan Irigasi Dan Jaringan",
    ASET_TETAP_LAIN: "Aset Tetap Lainnya",
    KONTRUKSI_DALAM_PEKERJAAN: "Konstruksi Dalam Pengerjaan",
    KEMITRAAN_PIHAK_KETIGA: "Kemitraan Pihak Ketiga",
    ASET_TAK_BERWUJUD: "Aset Tak Berwujud",
    ASET_LAIN_LAIN: "Aset Lain-Lain",
    PERSEDIAAN_RUSAK_BERAT_USANG: "Persediaan Rusak Berat/Usang",
    ASET_BERSEJARAH: "Aset Bersejarah",
} as const;

export type BmdAssetType =
    typeof BmdAssetType[keyof typeof BmdAssetType];

export const BmdAssetTypeLabel = {
    [BmdAssetType.TANAH]: "Tanah",
    [BmdAssetType.PERALATAN_DAN_MESIN]: "Peralatan Dan Mesin",
    [BmdAssetType.GEDUNG_DAN_BANGUNAN]: "Gedung Dan Bangunan",
    [BmdAssetType.JALAN_IRIGASI_DAN_JARINGAN]: "Jalan Irigasi Dan Jaringan",
    [BmdAssetType.ASET_TETAP_LAIN]: "Aset Tetap Lainnya",
    [BmdAssetType.KONTRUKSI_DALAM_PEKERJAAN]: "Konstruksi Dalam Pengerjaan",
    [BmdAssetType.KEMITRAAN_PIHAK_KETIGA]: "Kemitraan Pihak Ketiga",
    [BmdAssetType.ASET_TAK_BERWUJUD]: "Aset Tak Berwujud",
    [BmdAssetType.ASET_LAIN_LAIN]: "Aset Lain-Lain",
    [BmdAssetType.PERSEDIAAN_RUSAK_BERAT_USANG]: "Persediaan Rusak Berat/Usang",
    [BmdAssetType.ASET_BERSEJARAH]: "Aset Bersejarah",
} as const;

export type BmdAssetTypeLabel =
    typeof BmdAssetTypeLabel[keyof typeof BmdAssetTypeLabel];

export const BmdAssetTypeCode: Record<BmdAssetType, number> = {
    [BmdAssetType.TANAH]: 1,
    [BmdAssetType.PERALATAN_DAN_MESIN]: 2,
    [BmdAssetType.GEDUNG_DAN_BANGUNAN]: 3,
    [BmdAssetType.JALAN_IRIGASI_DAN_JARINGAN]: 4,
    [BmdAssetType.ASET_TETAP_LAIN]: 5,
    [BmdAssetType.KONTRUKSI_DALAM_PEKERJAAN]: 6,
    [BmdAssetType.KEMITRAAN_PIHAK_KETIGA]: 7,
    [BmdAssetType.ASET_TAK_BERWUJUD]: 8,
    [BmdAssetType.ASET_LAIN_LAIN]: 9,
    [BmdAssetType.PERSEDIAAN_RUSAK_BERAT_USANG]: 10,
    [BmdAssetType.ASET_BERSEJARAH]: 11,
};

export const BmdAssetTypeFromCode: Record<number, BmdAssetType> = {
    1: BmdAssetType.TANAH,
    2: BmdAssetType.PERALATAN_DAN_MESIN,
    3: BmdAssetType.GEDUNG_DAN_BANGUNAN,
    4: BmdAssetType.JALAN_IRIGASI_DAN_JARINGAN,
    5: BmdAssetType.ASET_TETAP_LAIN,
    6: BmdAssetType.KONTRUKSI_DALAM_PEKERJAAN,
    7: BmdAssetType.KEMITRAAN_PIHAK_KETIGA,
    8: BmdAssetType.ASET_TAK_BERWUJUD,
    9: BmdAssetType.ASET_LAIN_LAIN,
    10: BmdAssetType.PERSEDIAAN_RUSAK_BERAT_USANG,
    11: BmdAssetType.ASET_BERSEJARAH,
};