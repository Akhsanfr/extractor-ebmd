import * as XLSX from "xlsx-js-style";
import { saveAs } from "file-saver";
import { ListPemeliharaan, ListPengadaan } from "@/types/rkbmd";

/**
 * Fungsi Gabungan untuk Mengekspor Rencana Pengadaan dan Rencana Pemeliharaan
 * ke dalam satu file Excel dengan dua sheet terpisah.
 */
export async function exportRkbmdToExcel(
    pengadaanData: ListPengadaan[],
    pemeliharaanData: (ListPemeliharaan)[]
) {
    const wb = XLSX.utils.book_new();
    const borderThin = {
        top: { style: "thin" }, bottom: { style: "thin" },
        left: { style: "thin" }, right: { style: "thin" }
    };

    // Helper untuk penomoran
    const getAlpha = (i: number) => String.fromCharCode(65 + i); // A, B, C
    const getLowerAlpha = (i: number) => String.fromCharCode(97 + i); // a, b, c
    const getRoman = (i: number) => {
        const roman = ["I", "II", "III", "IV", "V", "VI", "VII", "VIII", "IX", "X"];
        return roman[i] || (i + 1).toString();
    };

    // ============================================================================
    // 1. PROSES DATA & SHEET: PENGADAAN
    // ============================================================================
    const groupedPengadaan: Record<string, any> = {};

    pengadaanData.forEach((item) => {
        const { penggunaBarang, kuasaPenggunaBarang, program, kegiatan, output } = item;

        if (!groupedPengadaan[penggunaBarang]) groupedPengadaan[penggunaBarang] = {};
        if (!groupedPengadaan[penggunaBarang][kuasaPenggunaBarang]) groupedPengadaan[penggunaBarang][kuasaPenggunaBarang] = {};
        if (!groupedPengadaan[penggunaBarang][kuasaPenggunaBarang][program]) groupedPengadaan[penggunaBarang][kuasaPenggunaBarang][program] = {};
        if (!groupedPengadaan[penggunaBarang][kuasaPenggunaBarang][program][kegiatan]) groupedPengadaan[penggunaBarang][kuasaPenggunaBarang][program][kegiatan] = {};
        if (!groupedPengadaan[penggunaBarang][kuasaPenggunaBarang][program][kegiatan][output]) groupedPengadaan[penggunaBarang][kuasaPenggunaBarang][program][kegiatan][output] = [];

        groupedPengadaan[penggunaBarang][kuasaPenggunaBarang][program][kegiatan][output].push(item);
    });

    const rowsPengadaan: any[][] = [];
    const headerPenggunaBarang = pengadaanData.length > 0 ? pengadaanData[0].penggunaBarang : "................(2)";

    rowsPengadaan.push(["RENCANA KEBUTUHAN BARANG MILIK DAERAH"]);
    rowsPengadaan.push(["(RENCANA PENGADAAN)"]);
    rowsPengadaan.push(["PENGGUNA BARANG", ":", headerPenggunaBarang]);
    rowsPengadaan.push(["TAHUN ANGGARAN", ":", "2027"]);
    rowsPengadaan.push([]);
    rowsPengadaan.push(["KAB/KOTA", ":", "PASURUAN"]);
    rowsPengadaan.push(["PROVINSI", ":", "JAWA TIMUR"]);
    rowsPengadaan.push([]);
    rowsPengadaan.push([
        "No", "Program / Kegiatan / Output", "Usulan Barang Milik Daerah", "", "", "",
        "Kebutuhan Maksimum", "", "Data Daftar Barang Yang Dapat Dioptimalkan", "", "", "",
        "Kebutuhan Riil Barang Milik Daerah", "", "Ket"
    ]);
    rowsPengadaan.push([
        "", "", "Kode Barang", "Nama Barang", "Jumlah", "Satuan",
        "Jumlah", "Satuan", "Kode Barang", "Nama Barang", "Jumlah", "Satuan",
        "Jumlah", "Satuan", ""
    ]);
    rowsPengadaan.push(["1", "2", "3", "4", "5", "6", "7", "8", "9", "10", "11", "12", "13", "14", "15"]);

    const startIdxPengadaan = rowsPengadaan.length;

    let pengIdx = 0;
    for (const [pengguna, kuasas] of Object.entries(groupedPengadaan)) {
        rowsPengadaan.push(["", `${getRoman(pengIdx)}. ${pengguna}`, "", "", "", "", "", "", "", "", "", "", "", "", ""]);

        let kuasaIdxP = 1;
        for (const [kuasa, programs] of Object.entries(kuasas as Record<string, any>)) {
            const isKuasaEmpty = !kuasa || kuasa.trim() === "" || kuasa === "-" || kuasa === "null";
            if (!isKuasaEmpty) {
                rowsPengadaan.push(["", `     ${kuasaIdxP}. ${kuasa}`, "", "", "", "", "", "", "", "", "", "", "", "", ""]);
                kuasaIdxP++;
            }

            let progIdx = 0;
            for (const [program, kegiatans] of Object.entries(programs as Record<string, any>)) {
                rowsPengadaan.push(["", `         ${getAlpha(progIdx)}. ${program}`, "", "", "", "", "", "", "", "", "", "", "", "", ""]);

                let kegIdx = 1;
                for (const [kegiatan, outputs] of Object.entries(kegiatans as Record<string, any>)) {
                    rowsPengadaan.push(["", `             ${kegIdx}). ${kegiatan}`, "", "", "", "", "", "", "", "", "", "", "", "", ""]);

                    let outIdx = 0;
                    for (const [output, items] of Object.entries(outputs as Record<string, any>)) {
                        rowsPengadaan.push(["", `                 ${getLowerAlpha(outIdx)}. ${output}`, "", "", "", "", "", "", "", "", "", "", "", "", ""]);

                        for (const item of items as ListPengadaan[]) {
                            rowsPengadaan.push([
                                "", "",
                                item.usulan?.kodeBarang || "-", item.usulan?.namaBarang || "-", item.usulan?.jumlah || "-", item.usulan?.satuan || "-",
                                "-", "-",
                                item.bmdBisaDioptimalkan?.kodeBarang || "-", item.bmdBisaDioptimalkan?.namaBarang || "-", item.bmdBisaDioptimalkan?.jumlah || "-", item.bmdBisaDioptimalkan?.satuan || "-",
                                item.kebutuhanRiil?.jumlah || "-", item.kebutuhanRiil?.satuan || "-", ""
                            ]);
                        }
                        outIdx++;
                    }
                    kegIdx++;
                }
                progIdx++;
            }
        }
        pengIdx++;
    }
    const endIdxPengadaan = rowsPengadaan.length;

    // ... (Sisa footer pengadaan sama seperti sebelumnya) ...
    rowsPengadaan.push([]);
    rowsPengadaan.push([]);
    rowsPengadaan.push(["", "", "", "", "", "", "", "", "", "", "", "", ".................., .................................... (21)", "", ""]);
    rowsPengadaan.push(["", "", "", "", "", "", "", "", "", "", "", "", "PENGGUNA BARANG………(22)", "", ""]);
    rowsPengadaan.push([]);
    rowsPengadaan.push([]);
    rowsPengadaan.push([]);
    rowsPengadaan.push(["", "", "", "", "", "", "", "", "", "", "", "", "..........................................................(23)", "", ""]);
    rowsPengadaan.push(["", "", "", "", "", "", "", "", "", "", "", "", "NIP ………………………….………… (23)", "", ""]);

    const wsPengadaan = XLSX.utils.aoa_to_sheet(rowsPengadaan);
    wsPengadaan["!cols"] = [
        { wch: 5 }, { wch: 45 }, { wch: 18 }, { wch: 30 }, { wch: 8 }, { wch: 10 }, { wch: 8 }, { wch: 10 },
        { wch: 18 }, { wch: 30 }, { wch: 8 }, { wch: 10 }, { wch: 8 }, { wch: 10 }, { wch: 18 }
    ];
    wsPengadaan["!merges"] = [
        { s: { r: 0, c: 0 }, e: { r: 0, c: 14 } }, { s: { r: 1, c: 0 }, e: { r: 1, c: 14 } },
        { s: { r: 8, c: 0 }, e: { r: 9, c: 0 } }, { s: { r: 8, c: 1 }, e: { r: 9, c: 1 } },
        { s: { r: 8, c: 2 }, e: { r: 8, c: 5 } }, { s: { r: 8, c: 6 }, e: { r: 8, c: 7 } },
        { s: { r: 8, c: 8 }, e: { r: 8, c: 11 } }, { s: { r: 8, c: 12 }, e: { r: 8, c: 13 } },
        { s: { r: 8, c: 14 }, e: { r: 9, c: 14 } }
    ];

    for (let R = 0; R < rowsPengadaan.length; ++R) {
        for (let C = 0; C < 15; ++C) {
            const cellRef = XLSX.utils.encode_cell({ r: R, c: C });
            if (!wsPengadaan[cellRef]) wsPengadaan[cellRef] = { t: "s", v: "" };
            if (R === 0 || R === 1) {
                wsPengadaan[cellRef].s = { font: { bold: true, sz: 12 }, alignment: { horizontal: "center", vertical: "center" } };
            } else if (R >= 2 && R <= 6) {
                wsPengadaan[cellRef].s = { font: { bold: true, sz: 11 } };
            } else if (R >= 8 && R < endIdxPengadaan) {
                const isHeader = R <= 10;
                wsPengadaan[cellRef].s = {
                    border: borderThin, font: { bold: isHeader, sz: 10 },
                    alignment: {
                        vertical: "center",
                        horizontal: isHeader ? "center" : (C === 0 || (C >= 4 && C <= 7) || (C >= 10 && C <= 13)) ? "center" : "left",
                        wrapText: true
                    }
                };
            } else if (R >= endIdxPengadaan) {
                wsPengadaan[cellRef].s = { font: { sz: 10, bold: R === endIdxPengadaan + 7 }, alignment: { vertical: "center" } };
            }
        }
    }
    XLSX.utils.book_append_sheet(wb, wsPengadaan, "PENGADAAN");


    // ============================================================================
    // 2. PROSES DATA & SHEET: PEMELIHARAAN
    // ============================================================================
    const groupedPemeliharaan: Record<string, any> = {};

    pemeliharaanData.forEach((item) => {
        const { penggunaBarang, kuasaPenggunaBarang, program, kegiatan, output } = item;

        // 1. Tambahkan Pengguna Barang ke Root Grouping Pemeliharaan
        if (!groupedPemeliharaan[penggunaBarang]) groupedPemeliharaan[penggunaBarang] = {};
        if (!groupedPemeliharaan[penggunaBarang][kuasaPenggunaBarang]) groupedPemeliharaan[penggunaBarang][kuasaPenggunaBarang] = {};
        if (!groupedPemeliharaan[penggunaBarang][kuasaPenggunaBarang][program]) groupedPemeliharaan[penggunaBarang][kuasaPenggunaBarang][program] = {};
        if (!groupedPemeliharaan[penggunaBarang][kuasaPenggunaBarang][program][kegiatan]) groupedPemeliharaan[penggunaBarang][kuasaPenggunaBarang][program][kegiatan] = {};
        if (!groupedPemeliharaan[penggunaBarang][kuasaPenggunaBarang][program][kegiatan][output]) groupedPemeliharaan[penggunaBarang][kuasaPenggunaBarang][program][kegiatan][output] = [];

        groupedPemeliharaan[penggunaBarang][kuasaPenggunaBarang][program][kegiatan][output].push(item);
    });

    const rowsPemeliharaan: any[][] = [];

    // 2. Ambil Header Dinamis
    const headerPenggunaBarangM = pemeliharaanData.length > 0 ? pemeliharaanData[0].penggunaBarang : "................(2)";

    rowsPemeliharaan.push(["RENCANA KEBUTUHAN BARANG MILIK DAERAH"]);
    rowsPemeliharaan.push(["(RENCANA PEMELIHARAAN)"]);
    rowsPemeliharaan.push(["PENGGUNA BARANG", ":", headerPenggunaBarangM]);
    rowsPemeliharaan.push(["TAHUN ANGGARAN", ":", "2027"]);
    rowsPemeliharaan.push([]);
    rowsPemeliharaan.push(["KAB/KOTA", ":", "PASURUAN"]);
    rowsPemeliharaan.push(["PROVINSI", ":", "JAWA TIMUR"]);
    rowsPemeliharaan.push([]);
    rowsPemeliharaan.push([
        "No.", "Kuasa Pengguna Barang/Program/Kegiatan/Output", "Barang Yang Dipelihara", "", "", "", "", "", "", "",
        "Usulan Kebutuhan Pemeliharaan", "", "", "Keterangan"
    ]);
    rowsPemeliharaan.push([
        "", "", "Kode Barang", "Nama Barang", "Jumlah", "Satuan", "Status Barang", "Kondisi Barang", "", "",
        "Nama Pemeliharaan", "Jumlah", "Satuan", ""
    ]);
    rowsPemeliharaan.push(["", "", "", "", "", "", "", "B", "RR", "RB", "", "", "", ""]);
    rowsPemeliharaan.push(["1", "2", "3", "4", "5", "6", "7", "8", "9", "10", "11", "12", "13", "14"]);

    const startIdxPemeliharaan = rowsPemeliharaan.length;

    // 3. Looping berjenjang dari Pengguna Barang
    let pengIdxM = 0;
    for (const [pengguna, kuasas] of Object.entries(groupedPemeliharaan)) {
        rowsPemeliharaan.push(["", `${getRoman(pengIdxM)}. ${pengguna}`, "", "", "", "", "", "", "", "", "", "", "", ""]);

        let kuasaIdxM = 1;
        for (const [kuasa, programs] of Object.entries(kuasas as Record<string, any>)) {

            // 4. Mekanisme Skip jika Kuasa Pengguna Barang kosong
            const isKuasaEmpty = !kuasa || kuasa.trim() === "" || kuasa === "-" || kuasa === "null";
            if (!isKuasaEmpty) {
                rowsPemeliharaan.push(["", `     ${kuasaIdxM}. ${kuasa}`, "", "", "", "", "", "", "", "", "", "", "", ""]);
                kuasaIdxM++;
            }

            let progIdx = 0;
            for (const [program, kegiatans] of Object.entries(programs as Record<string, any>)) {
                rowsPemeliharaan.push(["", `         ${getAlpha(progIdx)}. ${program}`, "", "", "", "", "", "", "", "", "", "", "", ""]);

                let kegIdx = 1;
                for (const [kegiatan, outputs] of Object.entries(kegiatans as Record<string, any>)) {
                    rowsPemeliharaan.push(["", `             ${kegIdx}). ${kegiatan}`, "", "", "", "", "", "", "", "", "", "", "", ""]);

                    let outIdx = 0;
                    for (const [output, items] of Object.entries(outputs as Record<string, any>)) {
                        rowsPemeliharaan.push(["", `                 ${getLowerAlpha(outIdx)}. ${output}`, "", "", "", "", "", "", "", "", "", "", "", ""]);

                        for (const item of items as any[]) {
                            // Penyesuaian agar kompatibel dengan Type `FormPemeliharan` 
                            // Fallback (||) digunakan jika properties berada di level flat object atau nested object
                            const kodeBrg = item.bmd?.kodeBarang || item.kodeBarang || "-";
                            const namaBrg = item.bmd?.namaBarang || item.namaBarang || "-";
                            const jmlTersedia = item.bmd?.jumlah || item.jumlahTersedia || "-";
                            const satTersedia = item.bmd?.satuan || item.satuan || "-";

                            const nmPemeliharaan = item.usulanPemeliharaan?.namaPemeliharaan || item.namaPemeliharaan || "-";
                            const jmlPemeliharaan = item.usulanPemeliharaan?.jumlah || item.jumlah || "-";
                            const satPemeliharaan = item.usulanPemeliharaan?.satuan || item.satuan || "-";

                            const ket = item.keterangan || "";

                            rowsPemeliharaan.push([
                                "", "",
                                kodeBrg, namaBrg, jmlTersedia, satTersedia,
                                "Milik Sendiri", "v", "", "",
                                nmPemeliharaan, jmlPemeliharaan, satPemeliharaan, ket
                            ]);
                        }
                        outIdx++;
                    }
                    kegIdx++;
                }
                progIdx++;
            }
        }
        pengIdxM++;
    }
    const endIdxPemeliharaan = rowsPemeliharaan.length;

    rowsPemeliharaan.push([]);
    rowsPemeliharaan.push([]);
    rowsPemeliharaan.push(["", "", "", "", "", "", "", "", "", "", ".................., .................................... (21)"]);
    rowsPemeliharaan.push(["", "", "", "", "", "", "", "", "", "", "PENGGUNA BARANG………(22)"]);
    // ... sisa footer petunjuk pengisian diabaikan agar kode tidak terlalu panjang (Anda bisa mempertahankan array aslinya di kode Anda)
    rowsPemeliharaan.push([]);
    rowsPemeliharaan.push(["Petunjuk Pengisian"]);
    rowsPemeliharaan.push(["(1)", "Diisi nomor halaman."]);

    const wsPemeliharaan = XLSX.utils.aoa_to_sheet(rowsPemeliharaan);
    wsPemeliharaan["!cols"] = [
        { wch: 5 }, { wch: 45 }, { wch: 18 }, { wch: 30 }, { wch: 8 }, { wch: 10 }, { wch: 15 },
        { wch: 5 }, { wch: 5 }, { wch: 5 }, { wch: 25 }, { wch: 8 }, { wch: 10 }, { wch: 18 }
    ];
    wsPemeliharaan["!merges"] = [
        { s: { r: 0, c: 0 }, e: { r: 0, c: 13 } }, { s: { r: 1, c: 0 }, e: { r: 1, c: 13 } },
        { s: { r: 8, c: 0 }, e: { r: 10, c: 0 } }, { s: { r: 8, c: 1 }, e: { r: 10, c: 1 } },
        { s: { r: 8, c: 2 }, e: { r: 8, c: 9 } }, { s: { r: 9, c: 2 }, e: { r: 10, c: 2 } },
        { s: { r: 9, c: 3 }, e: { r: 10, c: 3 } }, { s: { r: 9, c: 4 }, e: { r: 10, c: 4 } },
        { s: { r: 9, c: 5 }, e: { r: 10, c: 5 } }, { s: { r: 9, c: 6 }, e: { r: 10, c: 6 } },
        { s: { r: 9, c: 7 }, e: { r: 9, c: 9 } }, { s: { r: 8, c: 10 }, e: { r: 8, c: 12 } },
        { s: { r: 9, c: 10 }, e: { r: 10, c: 10 } }, { s: { r: 9, c: 11 }, e: { r: 10, c: 11 } },
        { s: { r: 9, c: 12 }, e: { r: 10, c: 12 } }, { s: { r: 8, c: 13 }, e: { r: 10, c: 13 } }
    ];

    for (let R = 0; R < rowsPemeliharaan.length; ++R) {
        for (let C = 0; C < 14; ++C) {
            const cellRef = XLSX.utils.encode_cell({ r: R, c: C });
            if (!wsPemeliharaan[cellRef]) wsPemeliharaan[cellRef] = { t: "s", v: "" };

            if (R === 0 || R === 1) {
                wsPemeliharaan[cellRef].s = { font: { bold: true, sz: 12 }, alignment: { horizontal: "center", vertical: "center" } };
            } else if (R >= 2 && R <= 6) {
                wsPemeliharaan[cellRef].s = { font: { bold: true, sz: 11 } };
            } else if (R >= 8 && R < endIdxPemeliharaan) {
                const isHeader = R <= 11;
                wsPemeliharaan[cellRef].s = {
                    border: borderThin, font: { bold: isHeader, sz: 10 },
                    alignment: {
                        vertical: "center",
                        horizontal: isHeader ? "center" : (C === 0 || (C >= 4 && C <= 9) || C === 11 || C === 12) ? "center" : "left",
                        wrapText: true
                    }
                };
            } else if (R >= endIdxPemeliharaan) {
                wsPemeliharaan[cellRef].s = { font: { sz: 10, bold: R === endIdxPemeliharaan + 7 }, alignment: { vertical: "center" } };
            }
        }
    }
    XLSX.utils.book_append_sheet(wb, wsPemeliharaan, "PEMELIHARAAN");

    // ============================================================================
    // 3. GENERATE & DOWNLOAD WORKBOOK GABUNGAN
    // ============================================================================

    // A. Kumpulkan semua relasi Kode Barang dan Aset Type
    const globalAsetTypeMap = new Map<string, string>();

    pengadaanData.forEach((item) => {
        if (item.usulan?.kodeBarang && item.usulan?.asetType) {
            globalAsetTypeMap.set(item.usulan.kodeBarang, item.usulan.asetType);
        }
        if (item.bmdBisaDioptimalkan?.kodeBarang && item.bmdBisaDioptimalkan?.asetType) {
            globalAsetTypeMap.set(item.bmdBisaDioptimalkan.kodeBarang, item.bmdBisaDioptimalkan.asetType);
        }
    });

    pemeliharaanData.forEach((item) => {
        const bmdData = (item as any).bmd || item; // Fallback jika format flat/nested
        if (bmdData?.kodeBarang && bmdData?.asetType) {
            globalAsetTypeMap.set(bmdData.kodeBarang, bmdData.asetType);
        }
    });

    // B. Buat Row untuk Sheet METADATA
    const metadataRows: any[][] = [["KODE_BARANG", "ASET_TYPE"]];
    globalAsetTypeMap.forEach((asetType, kodeBarang) => {
        metadataRows.push([kodeBarang, asetType]);
    });

    // C. Convert ke Sheet dan Append
    const wsMetadata = XLSX.utils.aoa_to_sheet(metadataRows);
    XLSX.utils.book_append_sheet(wb, wsMetadata, "METADATA");

    // D. Sembunyikan Sheet METADATA
    // SheetJS mengatur visibilitas melalui properti wb.Workbook.Sheets array
    if (!wb.Workbook) {
        wb.Workbook = { Views: [{ activeTab: 0 } as any] };
    }

    if (!wb.Workbook.Sheets) {
        wb.Workbook.Sheets = [];
    }

    // Index mengikuti urutan append: 0=PENGADAAN, 1=PEMELIHARAAN, 2=METADATA
    wb.Workbook.Sheets = [
        {}, // PENGADAAN (Normal)
        {}, // PEMELIHARAAN (Normal)
        { Hidden: 1 } // METADATA (Hidden)
    ];


    const excelBuffer = XLSX.write(wb, { bookType: "xlsx", type: "array" });
    const blob = new Blob([excelBuffer], { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" });
    saveAs(blob, "RKBMD_Gabungan_Pengadaan_dan_Pemeliharaan.xlsx");
}