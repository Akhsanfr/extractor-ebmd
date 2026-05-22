import * as XLSX from "xlsx";
import { FormPemeliharaanData } from "@/app/rkbmd/pemeliharaan/addData";
import { FormPengadaanData } from "@/app/rkbmd/pengadaan/addData";

// Regex untuk mendeteksi level hierarki berdasarkan prefix yang digenerate dari export
const REGEX_KUASA = /^\s*(\d+)\.\s+(.*)$/;         // Contoh: "1. NAMA KUASA PENGGUNA"
const REGEX_PROGRAM = /^\s*([A-Z])\.\s+(.*)$/;      // Contoh: "     A. NAMA PROGRAM"
const REGEX_KEGIATAN = /^\s*(\d+)\)\.\s+(.*)$/;     // Contoh: "          1). NAMA KEGIATAN"
const REGEX_OUTPUT = /^\s*([a-z])\.\s+(.*)$/;       // Contoh: "               a. NAMA OUTPUT"

export async function parseRkbmdExcel(file: File): Promise<{
    pengadaanData: FormPengadaanData[];
    pemeliharaanData: FormPemeliharaanData[];
}> {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();

        reader.onload = (e) => {
            try {
                const data = new Uint8Array(e.target?.result as ArrayBuffer);
                const workbook = XLSX.read(data, { type: "array" });

                const pengadaanData: FormPengadaanData[] = [];
                const pemeliharaanData: FormPemeliharaanData[] = [];

                // =========================================================
                // 1. PARSING SHEET PENGADAAN
                // =========================================================
                const sheetPengadaan = workbook.Sheets["PENGADAAN"];
                if (sheetPengadaan) {
                    const rowsP = XLSX.utils.sheet_to_json<any[]>(sheetPengadaan, { header: 1 });

                    let curKuasa = "", curProgram = "", curKegiatan = "", curOutput = "";
                    let isDataSection = false;

                    for (const row of rowsP) {
                        // Cek apakah sudah masuk ke baris data (baris setelah penomoran kolom 1-15)
                        if (row[0] === "1" && row[1] === "2") {
                            isDataSection = true;
                            continue;
                        }
                        if (!isDataSection) continue;

                        // Jika kolom B (index 1) kosong dan kolom C (index 2) juga kosong, dan ada tanda tangan di kolom M (index 12), berarti tabel selesai
                        if (!row[1] && !row[2] && row[12]?.toString().includes("...")) break;

                        const colB = row[1]?.toString() || "";
                        const colC = row[2]?.toString() || ""; // Kode Barang

                        if (colC) {
                            // JIKA ADA KODE BARANG -> INI BARIS DATA
                            const cleanVal = (val: any) => (val && val !== "-" ? val.toString() : "");

                            pengadaanData.push({
                                kuasaPenggunaBarang: curKuasa,
                                program: curProgram,
                                kegiatan: curKegiatan,
                                output: curOutput,
                                usulan: {
                                    kodeBarang: cleanVal(row[2]),
                                    namaBarang: cleanVal(row[3]),
                                    jumlah: Number(row[4]) || 0,
                                    satuan: cleanVal(row[5]),
                                },
                                bmdBisaDioptimalkan: {
                                    kodeBarang: cleanVal(row[8]),
                                    namaBarang: cleanVal(row[9]),
                                    jumlah: Number(row[10]) || 0,
                                    satuan: cleanVal(row[11]),
                                },
                                kebutuhanRiil: {
                                    jumlah: Number(row[12]) || 0,
                                    satuan: cleanVal(row[13]),
                                }
                            });
                        } else if (colB) {
                            // JIKA TIDAK ADA KODE BARANG TAPI ADA TEXT DI KOLOM B -> INI HIERARKI
                            if (REGEX_KUASA.test(colB)) curKuasa = colB.match(REGEX_KUASA)![2];
                            else if (REGEX_PROGRAM.test(colB)) curProgram = colB.match(REGEX_PROGRAM)![2];
                            else if (REGEX_KEGIATAN.test(colB)) curKegiatan = colB.match(REGEX_KEGIATAN)![2];
                            else if (REGEX_OUTPUT.test(colB)) curOutput = colB.match(REGEX_OUTPUT)![2];
                        }
                    }
                }

                // =========================================================
                // 2. PARSING SHEET PEMELIHARAAN
                // =========================================================
                const sheetPemeliharaan = workbook.Sheets["PEMELIHARAAN"];
                if (sheetPemeliharaan) {
                    const rowsM = XLSX.utils.sheet_to_json<any[]>(sheetPemeliharaan, { header: 1 });

                    let curKuasa = "", curProgram = "", curKegiatan = "", curOutput = "";
                    let isDataSection = false;

                    for (const row of rowsM) {
                        // Cek apakah sudah masuk ke baris data (baris setelah penomoran kolom 1-14)
                        if (row[0] === "1" && row[1] === "2") {
                            isDataSection = true;
                            continue;
                        }
                        if (!isDataSection) continue;

                        // Break jika masuk area Tanda Tangan
                        if (!row[1] && !row[2] && row[10]?.toString().includes("...")) break;

                        const colB = row[1]?.toString() || "";
                        const colC = row[2]?.toString() || ""; // Kode Barang

                        if (colC) {
                            // BARIS DATA
                            const cleanVal = (val: any) => (val && val !== "-" ? val.toString() : "");

                            pemeliharaanData.push({
                                kuasaPenggunaBarang: curKuasa,
                                program: curProgram,
                                kegiatan: curKegiatan,
                                output: curOutput,
                                kodeBarang: cleanVal(row[2]),
                                namaBarang: cleanVal(row[3]),
                                jumlahTersedia: Number(row[4]) || 0,
                                satuan: cleanVal(row[5]),
                                namaPemeliharaan: cleanVal(row[10]),
                                jumlah: Number(row[11]) || 0,
                                // Row 12 is satuan for pemeliharaan based on your export code
                                // (item.satuan is at row[12])
                                // Note: We use row[5] for 'satuan' of barang, and row[12] for 'satuan' of pemeliharaan
                            });
                        } else if (colB) {
                            // BARIS HIERARKI
                            if (REGEX_KUASA.test(colB)) curKuasa = colB.match(REGEX_KUASA)![2];
                            else if (REGEX_PROGRAM.test(colB)) curProgram = colB.match(REGEX_PROGRAM)![2];
                            else if (REGEX_KEGIATAN.test(colB)) curKegiatan = colB.match(REGEX_KEGIATAN)![2];
                            else if (REGEX_OUTPUT.test(colB)) curOutput = colB.match(REGEX_OUTPUT)![2];
                        }
                    }
                }

                resolve({ pengadaanData, pemeliharaanData });
            } catch (error) {
                reject(error);
            }
        };

        reader.onerror = (error) => reject(error);
        reader.readAsArrayBuffer(file);
    });
}