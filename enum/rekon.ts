export const RekonType = {
    ASET_TETAP: "asetTetap",
    PERSEDIAAN: "persediaan",
    PEMELIHARAAN: "pemeliharaan",
} as const;

export type RekonType =
    typeof RekonType[keyof typeof RekonType];

