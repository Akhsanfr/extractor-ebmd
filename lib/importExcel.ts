import * as XLSX from "xlsx";
import { ListPengadaan, FormPemeliharan } from "@/types/rkbmd"; // Sesuaikan path

/**
 * Fungsi untuk membaca dan mengekstrak data dari file Excel RKBMD
 * Mengembalikan objek berisi data Pengadaan dan Pemeliharaan.
 * @param file - File dari <input type="file">
 */
export async function importRkbmdFromExcel(file: File): Promise<{
    pengadaanData: ListPengadaan[];
    pemeliharaanData: FormPemeliharan[];
}> {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();

        reader.onload = (e) => {
            try {
                const data = e.target?.result;
                const workbook = XLSX.read(data, { type: "binary" });

                const pengadaanData: ListPengadaan[] = [];
                const pemeliharaanData: FormPemeliharan[] = [];

                // ============================================================================
                // 1. IMPORT SHEET: PENGADAAN
                // ============================================================================
                if (workbook.Sheets["PENGADAAN"]) {
                    // Ambil raw data sebagai array of arrays (AoA)
                    const rowsP = XLSX.utils.sheet_to_json<any[]>(workbook.Sheets["PENGADAAN"], { header: 1 });

                    let curPengguna = "", curKuasa = "", curProgram = "", curKegiatan = "", curOutput = "";

                    // Data dimulai dari baris ke-12 (index 11)
                    for (let i = 11; i < rowsP.length; i++) {
                        const row = rowsP[i];
                        if (!row || row.length === 0) continue;

                        // Deteksi bagian akhir (tanda tangan) untuk berhenti
                        if (typeof row[12] === "string" && row[12].includes("..................")) break;

                        const colGroup = row[1] ? String(row[1]).trim() : "";
                        const colKodeBarang = row[2] ? String(row[2]).trim() : "";

                        if (colGroup && !colKodeBarang) {
                            // Cek pola menggunakan Regex untuk menentukan level hierarki
                            if (/^[IVXLCDM]+\.\s+(.*)$/.test(colGroup)) {
                                curPengguna = colGroup.match(/^[IVXLCDM]+\.\s+(.*)$/)?.[1] || colGroup;
                            } else if (/^\d+\.\s+(.*)$/.test(colGroup)) {
                                curKuasa = colGroup.match(/^\d+\.\s+(.*)$/)?.[1] || colGroup;
                            } else if (/^[A-Z]\.\s+(.*)$/.test(colGroup)) {
                                curProgram = colGroup.match(/^[A-Z]\.\s+(.*)$/)?.[1] || colGroup;
                            } else if (/^\d+\)\.\s+(.*)$/.test(colGroup)) {
                                curKegiatan = colGroup.match(/^\d+\)\.\s+(.*)$/)?.[1] || colGroup;
                            } else if (/^[a-z]\.\s+(.*)$/.test(colGroup)) {
                                curOutput = colGroup.match(/^[a-z]\.\s+(.*)$/)?.[1] || colGroup;
                            }
                        } else if (colKodeBarang && colKodeBarang !== "-" && colKodeBarang !== "") {
                            // Ini adalah baris Data Barang
                            pengadaanData.push({
                                penggunaBarang: curPengguna,
                                kuasaPenggunaBarang: curKuasa,
                                program: curProgram,
                                kegiatan: curKegiatan,
                                output: curOutput,
                                usulan: {
                                    kodeBarang: row[2] || "",
                                    namaBarang: row[3] || "",
                                    jumlah: row[4] || 0,
                                    satuan: row[5] || ""
                                },
                                bmdBisaDioptimalkan: {
                                    kodeBarang: row[8] || "",
                                    namaBarang: row[9] || "",
                                    jumlah: row[10] || 0,
                                    satuan: row[11] || ""
                                },
                                kebutuhanRiil: {
                                    jumlah: row[12] || 0,
                                    satuan: row[13] || ""
                                }
                            } as ListPengadaan);
                        }
                    }
                }

                // ============================================================================
                // 2. IMPORT SHEET: PEMELIHARAAN
                // ============================================================================
                if (workbook.Sheets["PEMELIHARAAN"]) {
                    const rowsM = XLSX.utils.sheet_to_json<any[]>(workbook.Sheets["PEMELIHARAAN"], { header: 1 });

                    let curPengguna = "", curKuasa = "", curProgram = "", curKegiatan = "", curOutput = "";

                    // Data dimulai dari baris ke-13 (index 12)
                    for (let i = 12; i < rowsM.length; i++) {
                        const row = rowsM[i];
                        if (!row || row.length === 0) continue;

                        // Deteksi bagian akhir (tanda tangan) untuk berhenti
                        if (typeof row[10] === "string" && row[10].includes("..................")) break;

                        const colGroup = row[1] ? String(row[1]).trim() : "";
                        const colKodeBarang = row[2] ? String(row[2]).trim() : "";

                        if (colGroup && !colKodeBarang) {
                            if (/^[IVXLCDM]+\.\s+(.*)$/.test(colGroup)) {
                                curPengguna = colGroup.match(/^[IVXLCDM]+\.\s+(.*)$/)?.[1] || colGroup;
                            } else if (/^\d+\.\s+(.*)$/.test(colGroup)) {
                                curKuasa = colGroup.match(/^\d+\.\s+(.*)$/)?.[1] || colGroup;
                            } else if (/^[A-Z]\.\s+(.*)$/.test(colGroup)) {
                                curProgram = colGroup.match(/^[A-Z]\.\s+(.*)$/)?.[1] || colGroup;
                            } else if (/^\d+\)\.\s+(.*)$/.test(colGroup)) {
                                curKegiatan = colGroup.match(/^\d+\)\.\s+(.*)$/)?.[1] || colGroup;
                            } else if (/^[a-z]\.\s+(.*)$/.test(colGroup)) {
                                curOutput = colGroup.match(/^[a-z]\.\s+(.*)$/)?.[1] || colGroup;
                            }
                        } else if (colKodeBarang && colKodeBarang !== "-" && colKodeBarang !== "") {
                            // Ini adalah baris Data Barang
                            pemeliharaanData.push({
                                penggunaBarang: curPengguna,
                                kuasaPenggunaBarang: curKuasa,
                                program: curProgram,
                                kegiatan: curKegiatan,
                                output: curOutput,
                                bmd: {
                                    kodeBarang: row[2] || "",
                                    namaBarang: row[3] || "",
                                    jumlah: row[4] || 0,
                                    satuan: row[5] || ""
                                },
                                usulanPemeliharaan: {
                                    namaPemeliharaan: row[10] || "",
                                    jumlah: row[11] || 0,
                                    satuan: row[12] || ""
                                },
                                keterangan: row[13] || ""
                            } as FormPemeliharan);
                        }
                    }
                }

                resolve({ pengadaanData, pemeliharaanData });
            } catch (error) {
                reject(error);
            }
        };

        reader.onerror = (error) => reject(error);
        reader.readAsBinaryString(file);
    });
}