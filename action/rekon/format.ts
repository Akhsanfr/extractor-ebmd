import { parseRupiah } from "@/lib/number";
import { ExcelRow } from "@/lib/xlsx/parseXlsx";

const toText = (v: unknown): string | null => {
    const s = String(v ?? "").trim();
    return s === "" ? null : s;
};

const toRealisasi = (v: unknown): number | null =>
    toText(v) === null ? null : parseRupiah(v);

// Kolom: [0] Perangkat Daerah | [1] PIC Aset Tetap | [2] PIC Persediaan | [3] PIC Pemeliharaan
//        [4] No BA | [5] Aset Tetap | [6] Persediaan | [7] Pemeliharaan
export const RekonFormat = {
    import: (d: ExcelRow[]) => {
        return d
            .map((row, index) => ({
                perangkatDaerah: String(row[0] ?? "").trim(),
                picAsetTetap: toText(row[1]),
                picPersediaan: toText(row[2]),
                picPemeliharaan: toText(row[3]),
                nomorBA: toText(row[4]),
                asetTetap: toRealisasi(row[5]),
                persediaan: toRealisasi(row[6]),
                pemeliharaan: toRealisasi(row[7]),
                originalIndex: index,
            }))
            // Lewati baris kosong; originalIndex tetap menunjuk posisi asli di file.
            .filter((row) => row.perangkatDaerah !== "");
    },
};