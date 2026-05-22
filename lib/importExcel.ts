import * as XLSX from "xlsx";
import { ListPengadaan, FormPemeliharan } from "@/types/rkbmd";
import { AsetType } from "@/types/bmd"; // Pastikan path import ini sesuai

/**
 * Fungsi untuk membaca dan mengekstrak data dari file Excel RKBMD
 * Mengembalikan objek berisi data Pengadaan dan Pemeliharaan beserta relasi Aset Type-nya.
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
                // 0. BACA HIDDEN SHEET: METADATA ASET TYPE
                // ============================================================================
                const asetTypeMap = new Map<string, AsetType>();
                if (workbook.Sheets["METADATA"]) {
                    const rowsMeta = XLSX.utils.sheet_to_json<any[]>(workbook.Sheets["METADATA"], { header: 1 });
                    // Mulai dari 1 untuk skip baris header ["KODE_BARANG", "ASET_TYPE"]
                    for (let i = 1; i < rowsMeta.length; i++) {
                        const rowMeta = rowsMeta[i];
                        if (rowMeta && rowMeta[0] && rowMeta[1]) {
                            const kodeBarang = String(rowMeta[0]).trim();
                            const asetType = String(rowMeta[1]).trim() as AsetType;
                            asetTypeMap.set(kodeBarang, asetType);
                        }
                    }
                }

                // Helper function untuk mengambil aset type berdasarkan kode barang
                // Fallback default ke "peralatan_mesin" jika entah kenapa tidak ada di metadata
                const getAsetType = (kode: string): AsetType => {
                    return asetTypeMap.get(kode) || "peralatan_mesin";
                };

                // ============================================================================
                // 1. IMPORT SHEET: PENGADAAN
                // ============================================================================
                if (workbook.Sheets["PENGADAAN"]) {
                    // Ambil raw data sebagai array of arrays (AoA)
                    const rowsP = XLSX.utils.sheet_to_json<any[]>(workbook.Sheets["PENGADAAN"], { header: 1 });

                    let curPengguna = "", curKuasa = "", curProgram = "", curKegiatan = "", curOutput = "";

                    // Data tabel pengadaan dimulai dari baris ke-12 (index 11)
                    for (let i = 11; i < rowsP.length; i++) {
                        const row = rowsP[i];
                        if (!row || row.length === 0) continue;

                        // Deteksi bagian akhir (area tanda tangan) untuk berhenti membaca
                        if (typeof row[12] === "string" && row[12].includes("..................")) break;

                        const colGroup = row[1] ? String(row[1]).trim() : "";
                        const colKodeBarang = row[2] ? String(row[2]).trim() : "";
                        const colKodeBarangOpt = row[8] ? String(row[8]).trim() : ""; // Kode barang yg bisa dioptimalkan

                        if (colGroup && !colKodeBarang) {
                            // Cek pola menggunakan Regex untuk menentukan level hierarki
                            // PENTING: reset variabel level bawah saat level atas berubah,
                            // agar nilai lama tidak "bleeding" ke grup berikutnya.
                            if (/^[IVXLCDM]+\.\s+(.*)$/.test(colGroup)) {
                                curPengguna = colGroup.match(/^[IVXLCDM]+\.\s+(.*)$/)?.[1] || colGroup;
                                curKuasa = ""; curProgram = ""; curKegiatan = ""; curOutput = "";
                            } else if (/^\d+\.\s+(.*)$/.test(colGroup)) {
                                curKuasa = colGroup.match(/^\d+\.\s+(.*)$/)?.[1] || colGroup;
                                curProgram = ""; curKegiatan = ""; curOutput = "";
                            } else if (/^[A-Z]\.\s+(.*)$/.test(colGroup)) {
                                curProgram = colGroup.match(/^[A-Z]\.\s+(.*)$/)?.[1] || colGroup;
                                curKegiatan = ""; curOutput = "";
                            } else if (/^\d+\)\.\s+(.*)$/.test(colGroup)) {
                                curKegiatan = colGroup.match(/^\d+\)\.\s+(.*)$/)?.[1] || colGroup;
                                curOutput = "";
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
                                    kodeBarang: colKodeBarang,
                                    namaBarang: row[3] || "",
                                    jumlah: Number(row[4]) || 0,
                                    satuan: row[5] || "",
                                    asetType: getAsetType(colKodeBarang) // Mengambil dari Map
                                },
                                bmdBisaDioptimalkan: {
                                    kodeBarang: colKodeBarangOpt,
                                    namaBarang: row[9] || "",
                                    jumlah: Number(row[10]) || 0,
                                    satuan: row[11] || "",
                                    asetType: colKodeBarangOpt && colKodeBarangOpt !== "-" ? getAsetType(colKodeBarangOpt) : "peralatan_mesin"
                                },
                                kebutuhanRiil: {
                                    jumlah: Number(row[12]) || 0,
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

                    // Data tabel pemeliharaan dimulai dari baris ke-13 (index 12)
                    for (let i = 12; i < rowsM.length; i++) {
                        const row = rowsM[i];
                        if (!row || row.length === 0) continue;

                        // Deteksi bagian akhir (area tanda tangan) untuk berhenti membaca
                        if (typeof row[10] === "string" && row[10].includes("..................")) break;

                        const colGroup = row[1] ? String(row[1]).trim() : "";
                        const colKodeBarang = row[2] ? String(row[2]).trim() : "";

                        if (colGroup && !colKodeBarang) {
                            // Reset variabel level bawah saat level atas berubah (sama seperti PENGADAAN)
                            if (/^[IVXLCDM]+\.\s+(.*)$/.test(colGroup)) {
                                curPengguna = colGroup.match(/^[IVXLCDM]+\.\s+(.*)$/)?.[1] || colGroup;
                                curKuasa = ""; curProgram = ""; curKegiatan = ""; curOutput = "";
                            } else if (/^\d+\.\s+(.*)$/.test(colGroup)) {
                                curKuasa = colGroup.match(/^\d+\.\s+(.*)$/)?.[1] || colGroup;
                                curProgram = ""; curKegiatan = ""; curOutput = "";
                            } else if (/^[A-Z]\.\s+(.*)$/.test(colGroup)) {
                                curProgram = colGroup.match(/^[A-Z]\.\s+(.*)$/)?.[1] || colGroup;
                                curKegiatan = ""; curOutput = "";
                            } else if (/^\d+\)\.\s+(.*)$/.test(colGroup)) {
                                curKegiatan = colGroup.match(/^\d+\)\.\s+(.*)$/)?.[1] || colGroup;
                                curOutput = "";
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
                                    kodeBarang: colKodeBarang,
                                    namaBarang: row[3] || "",
                                    jumlah: Number(row[4]) || 0,
                                    satuan: row[5] || "",
                                    asetType: getAsetType(colKodeBarang) // Mengambil dari Map
                                },
                                usulanPemeliharaan: {
                                    namaPemeliharaan: row[10] || "",
                                    jumlah: Number(row[11]) || 0,
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