import * as XLSX from "xlsx";

export type ExcelRow = (string | null)[];


export const parseExcelFile = async (
    file: File | Blob,
    sheetName: string,
): Promise<ExcelRow[]> => {

    const buffer = await file.arrayBuffer();
    const workbook = XLSX.read(new Uint8Array(buffer), {
        type: "array",
        cellDates: true,
    });

    const worksheet = sheetName ? workbook.Sheets[sheetName] : undefined;

    if (!worksheet) {
        throw new Error(
            `Sheet ${sheetName} tidak ditemukan. Sheet tersedia: ${workbook.SheetNames.join(", ")}`
        );
    }

    return XLSX.utils.sheet_to_json<ExcelRow>(worksheet, {
        header: 1,
        range: 1,
        defval: null,
        raw: true,
    });
}