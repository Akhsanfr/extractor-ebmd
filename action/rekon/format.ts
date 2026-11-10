import { parseRupiah } from "@/lib/number";
import { ExcelRow } from "@/lib/xlsx/parseXlsx";
import { OperationalError } from "@/action/actionResponse";

const toText = (v: unknown): string | null => {
    const s = String(v ?? "").trim();
    return s === "" ? null : s;
};

const toRealisasi = (v: unknown): number | null =>
    toText(v) === null ? null : parseRupiah(v);

const pad = (n: number) => String(n).padStart(2, "0");
const ymd = (d: Date) => `${d.getUTCFullYear()}-${pad(d.getUTCMonth() + 1)}-${pad(d.getUTCDate())}`;

// Sel tanggal Excel bisa berupa Date, serial number, atau teks (yyyy-mm-dd / dd/mm/yyyy).
// Hasil: "YYYY-MM-DD", atau null jika kosong. Melempar error jika tidak bisa dibaca.
const toTanggal = (v: unknown, rowNo: number): string | null => {
    if (v === null || v === undefined || v === "") return null;

    let d: Date | null = null;
    if (v instanceof Date) {
        d = v;
    } else if (typeof v === "number") {
        d = new Date(Math.round((v - 25569) * 86400 * 1000)); // epoch Excel -> Unix
    } else {
        const s = String(v).trim();
        if (s === "") return null;
        let m = s.match(/^(\d{4})-(\d{1,2})-(\d{1,2})/);
        if (m) d = new Date(Date.UTC(+m[1], +m[2] - 1, +m[3]));
        else if ((m = s.match(/^(\d{1,2})[/-](\d{1,2})[/-](\d{4})$/))) {
            d = new Date(Date.UTC(+m[3], +m[2] - 1, +m[1]));
        }
    }
    if (!d || Number.isNaN(d.getTime())) {
        throw new OperationalError(`Tanggal Rekon tidak valid pada data ke-${rowNo}: "${String(v)}"`);
    }
    return ymd(d);
};

// Kolom: [0] Perangkat Daerah | [1] PIC Aset Tetap | [2] PIC Persediaan | [3] PIC Pemeliharaan
//        [4] Tanggal Rekon | [5] No BA | [6] Aset Tetap | [7] Persediaan | [8] Pemeliharaan
export const RekonFormat = {
    import: (d: ExcelRow[]) => {
        return d
            .map((row, index) => ({
                perangkatDaerah: String(row[0] ?? "").trim(),
                picAsetTetap: toText(row[1]),
                picPersediaan: toText(row[2]),
                picPemeliharaan: toText(row[3]),
                tanggalRekon: String(row[0] ?? "").trim() === "" ? null : toTanggal(row[4], index + 1),
                nomorBA: toText(row[5]),
                asetTetap: toRealisasi(row[6]),
                persediaan: toRealisasi(row[7]),
                pemeliharaan: toRealisasi(row[8]),
                originalIndex: index,
            }))
            .filter((row) => row.perangkatDaerah !== "");
    },
};