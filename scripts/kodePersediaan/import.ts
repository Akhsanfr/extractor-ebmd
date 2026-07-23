import { db } from "@/drizzle";
import { kodePersediaan } from "@/drizzle/schema/kodePersediaan";
import ExcelJS from "exceljs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const INPUT_FILE = path.join(__dirname, "kodePersediaan.xlsx");
const OUTPUT_FILE = path.join(__dirname, "kodePersediaanOutput.xlsx");

// Kolom sumber (sesuai header di file Excel):
// A: kode 108
// B: kategori
// C: nama 108
// D: kode nusp
// E: nama barang nusp
// F: satuan
// G: active
const COLUMN = {
    kode108: 1,
    kategori: 2,
    nama108: 3,
    kodeNusp: 4,
    namaBarang: 5,
    satuan: 6,
    active: 7,
} as const;

const STATUS_COLUMN = 8;
const KETERANGAN_COLUMN = 9;

async function main() {
    const workbook = new ExcelJS.Workbook();
    await workbook.xlsx.readFile(INPUT_FILE);

    const sheet = workbook.worksheets[0];

    sheet.getCell(1, STATUS_COLUMN).value = "STATUS";
    sheet.getCell(1, KETERANGAN_COLUMN).value = "KETERANGAN";

    let successCount = 0;
    let failedCount = 0;

    for (let rowNumber = 2; rowNumber <= sheet.rowCount; rowNumber++) {
        const row = sheet.getRow(rowNumber);
        const active = Boolean(row.getCell(COLUMN.active).value);
        if (!active) continue;

        const kode108 = String(row.getCell(COLUMN.kode108).value ?? "").trim();
        const kategori = String(row.getCell(COLUMN.kategori).value ?? "").trim();
        const nama108 = String(row.getCell(COLUMN.nama108).value ?? "").trim();
        const kodeNusp = String(row.getCell(COLUMN.kodeNusp).value ?? "").trim();
        const namaBarang = String(
            row.getCell(COLUMN.namaBarang).value ?? ""
        ).trim();
        const satuan = String(row.getCell(COLUMN.satuan).value ?? "").trim();

        // Lewati baris kosong tanpa menandainya FAILED
        if (!kode108 && !nama108 && !kodeNusp && !namaBarang && !satuan) {
            continue;
        }

        try {
            if (!kode108) throw new Error("Kode 108 kosong");
            if (!nama108) throw new Error("Nama 108 kosong");
            if (!kodeNusp) throw new Error("Kode NUSP kosong");
            if (!namaBarang) throw new Error("Nama barang NUSP kosong");
            if (!satuan) throw new Error("Satuan kosong");


            console.log("kodeNusp", kodeNusp);

            const inserted = await db
                .insert(kodePersediaan)
                .values({
                    kode108,
                    kategori,
                    nama108,
                    kodeNusp,
                    namaBarang,
                    satuan,
                })
                .returning({
                    id: kodePersediaan.id,
                });

            row.getCell(STATUS_COLUMN).value = "SUCCESS";
            row.getCell(KETERANGAN_COLUMN).value = `ID ${inserted[0].id}`;
            successCount++;
        } catch (err) {
            row.getCell(STATUS_COLUMN).value = "FAILED";
            row.getCell(KETERANGAN_COLUMN).value =
                err instanceof Error ? err.message : String(err);
            failedCount++;
        }
    }

    await workbook.xlsx.writeFile(OUTPUT_FILE);

    console.log(`Import selesai. Sukses: ${successCount}, Gagal: ${failedCount}`);
}

main().catch(console.error);