import * as XLSX from "xlsx";
import { ListPengadaan, FormPemeliharan } from "@/types/rkbmd";
import { AsetType } from "@/types/bmd";
import { parseHierarchy } from "./rkbmd/parseHierarchy";
import { dedupArray, isEqualPemeliharaan, isEqualPengadaan } from "./rkbmd/cekDuplikat";

interface HierarchyState {
    curPengguna: string;
    curKuasa: string;
    curProgram: string;
    curKegiatan: string;
    curOutput: string;
}


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
                    for (let i = 1; i < rowsMeta.length; i++) {
                        const rowMeta = rowsMeta[i];
                        if (rowMeta && rowMeta[0] && rowMeta[1]) {
                            const kodeBarang = String(rowMeta[0]).trim();
                            const asetType = String(rowMeta[1]).trim() as AsetType;
                            asetTypeMap.set(kodeBarang, asetType);
                        }
                    }
                }

                const getAsetType = (kode: string): AsetType => {
                    return asetTypeMap.get(kode) || "peralatan_mesin";
                };

                // ============================================================================
                // 1. IMPORT SHEET: PENGADAAN
                // ============================================================================
                if (workbook.Sheets["PENGADAAN"]) {
                    const rowsP = XLSX.utils.sheet_to_json<any[]>(workbook.Sheets["PENGADAAN"], { header: 1 });
                    const s: HierarchyState = { curPengguna: "", curKuasa: "", curProgram: "", curKegiatan: "", curOutput: "" };

                    for (let i = 11; i < rowsP.length; i++) {
                        const row = rowsP[i];
                        if (!row || row.length === 0) continue;
                        if (typeof row[12] === "string" && row[12].includes("..................")) break;

                        const colGroup = row[1] ? String(row[1]) : "";
                        const colKodeBarang = row[2] ? String(row[2]).trim() : "";
                        const colKodeBarangOpt = row[8] ? String(row[8]).trim() : "";

                        if (colGroup && !colKodeBarang) {
                            parseHierarchy(colGroup, s);
                        } else if (colKodeBarang && colKodeBarang !== "-" && colKodeBarang !== "") {
                            const newItem = {
                                penggunaBarang: s.curPengguna,
                                kuasaPenggunaBarang: s.curKuasa,
                                program: s.curProgram,
                                kegiatan: s.curKegiatan,
                                output: s.curOutput,
                                usulan: {
                                    kodeBarang: colKodeBarang,
                                    namaBarang: row[3] || "",
                                    jumlah: Number(row[4]) || 0,
                                    satuan: row[5] || "",
                                    asetType: getAsetType(colKodeBarang)
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
                            } as ListPengadaan;
                            pengadaanData.push(newItem);
                        }
                    }
                }

                // ============================================================================
                // 2. IMPORT SHEET: PEMELIHARAAN
                // ============================================================================
                if (workbook.Sheets["PEMELIHARAAN"]) {
                    const rowsM = XLSX.utils.sheet_to_json<any[]>(workbook.Sheets["PEMELIHARAAN"], { header: 1 });
                    const s: HierarchyState = { curPengguna: "", curKuasa: "", curProgram: "", curKegiatan: "", curOutput: "" };

                    for (let i = 12; i < rowsM.length; i++) {
                        const row = rowsM[i];
                        if (!row || row.length === 0) continue;
                        if (typeof row[10] === "string" && row[10].includes("..................")) break;

                        const colGroup = row[1] ? String(row[1]) : "";
                        const colKodeBarang = row[2] ? String(row[2]).trim() : "";

                        if (colGroup && !colKodeBarang) {
                            parseHierarchy(colGroup, s);
                        } else if (colKodeBarang && colKodeBarang !== "-" && colKodeBarang !== "") {
                            const newItem = {
                                penggunaBarang: s.curPengguna,
                                kuasaPenggunaBarang: s.curKuasa,
                                program: s.curProgram,
                                kegiatan: s.curKegiatan,
                                output: s.curOutput,
                                bmd: {
                                    kodeBarang: colKodeBarang,
                                    namaBarang: row[3] || "",
                                    jumlah: Number(row[4]) || 0,
                                    satuan: row[5] || "",
                                    asetType: getAsetType(colKodeBarang)
                                },
                                usulanPemeliharaan: {
                                    namaPemeliharaan: row[10] || "",
                                    jumlah: Number(row[11]) || 0,
                                    satuan: row[12] || ""
                                },
                                keterangan: row[13] || ""
                            } as FormPemeliharan;
                            pemeliharaanData.push(newItem);
                        }
                    }
                }

                resolve({
                    pengadaanData: dedupArray(pengadaanData, isEqualPengadaan),
                    pemeliharaanData: dedupArray(pemeliharaanData, isEqualPemeliharaan),
                });
            } catch (error) {
                reject(error);
            }
        };

        reader.onerror = (error) => reject(error);
        reader.readAsBinaryString(file);
    });
}