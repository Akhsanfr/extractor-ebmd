import { parseRupiah } from "@/lib/number";
import { ExcelRow } from "@/lib/xlsx/parseXlsx";

// Kolom Excel: [0] Perangkat Daerah | [1] Aset Tetap | [2] Persediaan | [3] Pemeliharaan
export const RekonFormat = {
    import: (d: ExcelRow[]) => {
        return d
            .map((row, index) => ({
                perangkatDaerah: String(row[0] ?? "").trim(),
                asetTetap: parseRupiah(row[1]),
                persediaan: parseRupiah(row[2]),
                pemeliharaan: parseRupiah(row[3]),
                originalIndex: index,
            }))
            // Lewati baris kosong; originalIndex tetap menunjuk posisi asli di file.
            .filter((row) => row.perangkatDaerah !== "");
    },
};
