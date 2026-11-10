import * as XLSX from "xlsx";

export type ExcelRow = (string | number | null)[];

const pad = (n: number) => String(n).padStart(2, "0");

// SheetJS (cellDates) menghasilkan Date yang bisa meleset beberapa detik dari
// tengah malam lokal (mis. 23:59:48 hari sebelumnya di Asia/Jakarta).
// +12 jam lalu baca komponen lokal => tanggal kalender yang benar di timezone mana pun.
const toDateOnly = (d: Date) => {
    const x = new Date(d.getTime() + 12 * 60 * 60 * 1000);
    return `${x.getFullYear()}-${pad(x.getMonth() + 1)}-${pad(x.getDate())}`;
};

export const parseExcelFile = async (file: File | Blob, sheetName: string): Promise<ExcelRow[]> => {
    const buffer = await file.arrayBuffer();
    const workbook = XLSX.read(new Uint8Array(buffer), { type: "array", cellDates: true });

    const worksheet = sheetName ? workbook.Sheets[sheetName] : undefined;
    if (!worksheet) {
        throw new Error(
            `Sheet ${sheetName} tidak ditemukan. Sheet tersedia: ${workbook.SheetNames.join(", ")}`,
        );
    }

    const rows = XLSX.utils.sheet_to_json<unknown[]>(worksheet, {
        header: 1,
        range: 1,
        defval: null,
        raw: true,
    });

    return rows.map((row) =>
        row.map((v) => (v instanceof Date ? toDateOnly(v) : (v as string | number | null))),
    );
};