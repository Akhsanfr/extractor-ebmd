import * as XLSX from "xlsx-js-style";
import { saveAs } from "file-saver";
import { FormPemeliharaanData } from "@/app/rkbmd/pemeliharaan/addData";
import { ListPengadaan } from "@/types/rkbmd";

/**
 * Fungsi Gabungan untuk Mengekspor Rencana Pengadaan dan Rencana Pemeliharaan
 * ke dalam satu file Excel dengan dua sheet terpisah.
 */
export async function exportRkbmdToExcel(
    pengadaanData: ListPengadaan[],
    pemeliharaanData: FormPemeliharaanData[]
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

        // Menambahkan penggunaBarang ke dalam hierarki grouping
        if (!groupedPengadaan[penggunaBarang]) groupedPengadaan[penggunaBarang] = {};
        if (!groupedPengadaan[penggunaBarang][kuasaPenggunaBarang]) groupedPengadaan[penggunaBarang][kuasaPenggunaBarang] = {};
        if (!groupedPengadaan[penggunaBarang][kuasaPenggunaBarang][program]) groupedPengadaan[penggunaBarang][kuasaPenggunaBarang][program] = {};
        if (!groupedPengadaan[penggunaBarang][kuasaPenggunaBarang][program][kegiatan]) groupedPengadaan[penggunaBarang][kuasaPenggunaBarang][program][kegiatan] = {};
        if (!groupedPengadaan[penggunaBarang][kuasaPenggunaBarang][program][kegiatan][output]) groupedPengadaan[penggunaBarang][kuasaPenggunaBarang][program][kegiatan][output] = [];

        groupedPengadaan[penggunaBarang][kuasaPenggunaBarang][program][kegiatan][output].push(item);
    });

    const rowsPengadaan: any[][] = [];

    // Mengambil nama pengguna barang untuk header atas (default ke string kosong jika data kosong)
    const headerPenggunaBarang = pengadaanData.length > 0 ? pengadaanData[0].penggunaBarang : "................(2)";

    rowsPengadaan.push(["RENCANA KEBUTUHAN BARANG MILIK DAERAH"]);
    rowsPengadaan.push(["(RENCANA PENGADAAN)"]);
    rowsPengadaan.push(["PENGGUNA BARANG", ":", headerPenggunaBarang]); // Header terisi otomatis
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

    // Loop berjenjang dimulai dari penggunaBarang
    let pengIdx = 0;
    for (const [pengguna, kuasas] of Object.entries(groupedPengadaan)) {
        // Tulis row Pengguna Barang
        rowsPengadaan.push(["", `${getRoman(pengIdx)}. ${pengguna}`, "", "", "", "", "", "", "", "", "", "", "", "", ""]);

        let kuasaIdxP = 1;
        for (const [kuasa, programs] of Object.entries(kuasas as Record<string, any>)) {

            // CEK: Jika kuasa pengguna barang tidak kosong, maka tulis row-nya
            const isKuasaEmpty = !kuasa || kuasa.trim() === "" || kuasa === "-" || kuasa === "null";
            if (!isKuasaEmpty) {
                rowsPengadaan.push(["", `     ${kuasaIdxP}. ${kuasa}`, "", "", "", "", "", "", "", "", "", "", "", "", ""]);
                kuasaIdxP++; // Increment hanya jika row kuasa ditulis
            }

            let progIdx = 0;
            for (const [program, kegiatans] of Object.entries(programs as Record<string, any>)) {
                // Indentasi disesuaikan secara visual
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
        { s: { r: 0, c: 0 }, e: { r: 0, c: 14 } },
        { s: { r: 1, c: 0 }, e: { r: 1, c: 14 } },
        { s: { r: 8, c: 0 }, e: { r: 9, c: 0 } },
        { s: { r: 8, c: 1 }, e: { r: 9, c: 1 } },
        { s: { r: 8, c: 2 }, e: { r: 8, c: 5 } },
        { s: { r: 8, c: 6 }, e: { r: 8, c: 7 } },
        { s: { r: 8, c: 8 }, e: { r: 8, c: 11 } },
        { s: { r: 8, c: 12 }, e: { r: 8, c: 13 } },
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
                    border: borderThin,
                    font: { bold: isHeader, sz: 10 },
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
        const { kuasaPenggunaBarang, program, kegiatan, output } = item;
        if (!groupedPemeliharaan[kuasaPenggunaBarang]) groupedPemeliharaan[kuasaPenggunaBarang] = {};
        if (!groupedPemeliharaan[kuasaPenggunaBarang][program]) groupedPemeliharaan[kuasaPenggunaBarang][program] = {};
        if (!groupedPemeliharaan[kuasaPenggunaBarang][program][kegiatan]) groupedPemeliharaan[kuasaPenggunaBarang][program][kegiatan] = {};
        if (!groupedPemeliharaan[kuasaPenggunaBarang][program][kegiatan][output]) groupedPemeliharaan[kuasaPenggunaBarang][program][kegiatan][output] = [];
        groupedPemeliharaan[kuasaPenggunaBarang][program][kegiatan][output].push(item);
    });

    const rowsPemeliharaan: any[][] = [];
    rowsPemeliharaan.push(["RENCANA KEBUTUHAN BARANG MILIK DAERAH"]);
    rowsPemeliharaan.push(["(RENCANA PEMELIHARAAN)"]);
    rowsPemeliharaan.push(["PENGGUNA BARANG", ":", "................(2)"]);
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
    let kuasaIdxM = 1;
    for (const [kuasa, programs] of Object.entries(groupedPemeliharaan)) {
        rowsPemeliharaan.push(["", `${kuasaIdxM}. ${kuasa}`, "", "", "", "", "", "", "", "", "", "", "", ""]);
        let progIdx = 0;
        for (const [program, kegiatans] of Object.entries(programs as Record<string, any>)) {
            rowsPemeliharaan.push(["", `     ${getAlpha(progIdx)}. ${program}`, "", "", "", "", "", "", "", "", "", "", "", ""]);
            let kegIdx = 1;
            for (const [kegiatan, outputs] of Object.entries(kegiatans as Record<string, any>)) {
                rowsPemeliharaan.push(["", `          ${kegIdx}). ${kegiatan}`, "", "", "", "", "", "", "", "", "", "", "", ""]);
                let outIdx = 0;
                for (const [output, items] of Object.entries(outputs as Record<string, any>)) {
                    rowsPemeliharaan.push(["", `               ${getLowerAlpha(outIdx)}. ${output}`, "", "", "", "", "", "", "", "", "", "", "", ""]);
                    for (const item of items as FormPemeliharaanData[]) {
                        rowsPemeliharaan.push([
                            "", "",
                            item.kodeBarang, item.namaBarang, item.jumlahTersedia, item.satuan,
                            "Milik Sendiri", "v", "", "",
                            item.namaPemeliharaan, item.jumlah, item.satuan, ""
                        ]);
                    }
                    outIdx++;
                }
                kegIdx++;
            }
            progIdx++;
        }
        kuasaIdxM++;
    }
    const endIdxPemeliharaan = rowsPemeliharaan.length;

    rowsPemeliharaan.push([]);
    rowsPemeliharaan.push([]);
    rowsPemeliharaan.push(["", "", "", "", "", "", "", "", "", "", ".................., .................................... (21)"]);
    rowsPemeliharaan.push(["", "", "", "", "", "", "", "", "", "", "PENGGUNA BARANG………(22)"]);
    rowsPemeliharaan.push([]);
    rowsPemeliharaan.push([]);
    rowsPemeliharaan.push([]);
    rowsPemeliharaan.push(["", "", "", "", "", "", "", "", "", "", "..........................................................(23)"]);
    rowsPemeliharaan.push(["", "", "", "", "", "", "", "", "", "", "NIP ………………………….………… (23)"]);
    rowsPemeliharaan.push([]);
    rowsPemeliharaan.push(["Petunjuk Pengisian"]);
    rowsPemeliharaan.push(["(1)", "Diisi nomor halaman."]);
    rowsPemeliharaan.push(["(2)", "Diisi nama pengguna barang."]);
    rowsPemeliharaan.push(["(3)", "Diisi tahun anggaran RKBMD yang diusulkan."]);
    rowsPemeliharaan.push(["(4)", "Disi nama Pemerintah Provinsi."]);
    rowsPengadaan.push(["(5)", "Disi nama Pemerintah Kabupaten/Kota."]);
    rowsPemeliharaan.push(["(6)", "Diisi no urut."]);
    rowsPemeliharaan.push(["(7)", "Diisi Kuasa Pengguna Barang/Program/Kegiatan/Output berdasarkan rencana kerja SKPD."]);
    rowsPemeliharaan.push(["(8)", "Diisi kode barang berdasarkan ketentuan penggolongan dan kodefikasi Barang Milik Daerah yang berlaku."]);
    rowsPemeliharaan.push(["(9)", "Diisi nama barang sesuai kolom (8)."]);
    rowsPemeliharaan.push(["(10)", "Diisi kuantitas barang yang diusulkan."]);
    rowsPemeliharaan.push(["(11)", "Diisi satuan barang yang dipelihara (m, m², unit, buah, set, dsb)."]);
    rowsPemeliharaan.push(["(12)", "Diisi status barang milik daerah yang pemeliharaannya dibiayai APBD."]);
    rowsPemeliharaan.push(["(13)", "Diisi 'v' jika kondisi barang Baik (B)."]);
    rowsPemeliharaan.push(["(14)", "Diisi 'v' jika kondisi barang Rusak Ringan (RR)."]);
    rowsPemeliharaan.push(["(15)", "Diisi 'v' jika kondisi barang Rusak Berat (RB)."]);
    rowsPemeliharaan.push(["(16)", "Diisi uraian nama pemeliharaan."]);
    rowsPemeliharaan.push(["(17)", "Diisi kuantitas barang yang diusulkan dipelihara."]);
    rowsPemeliharaan.push(["(18)", "Diisi satuan barang yang diusulkan dipelihara."]);
    rowsPemeliharaan.push(["(19)", "Diisi keterangan penting lainnya."]);
    rowsPemeliharaan.push(["(20)", "Diisi tempat dan tanggal disahkan."]);
    rowsPemeliharaan.push(["(21)", "Diisi jabatan Pengguna Barang yang menandatangani."]);

    const wsPemeliharaan = XLSX.utils.aoa_to_sheet(rowsPemeliharaan);
    wsPemeliharaan["!cols"] = [
        { wch: 5 }, { wch: 45 }, { wch: 18 }, { wch: 30 }, { wch: 8 }, { wch: 10 }, { wch: 15 },
        { wch: 5 }, { wch: 5 }, { wch: 5 }, { wch: 25 }, { wch: 8 }, { wch: 10 }, { wch: 18 }
    ];
    wsPemeliharaan["!merges"] = [
        { s: { r: 0, c: 0 }, e: { r: 0, c: 13 } },
        { s: { r: 1, c: 0 }, e: { r: 1, c: 13 } },
        { s: { r: 8, c: 0 }, e: { r: 10, c: 0 } },
        { s: { r: 8, c: 1 }, e: { r: 10, c: 1 } },
        { s: { r: 8, c: 2 }, e: { r: 8, c: 9 } },
        { s: { r: 9, c: 2 }, e: { r: 10, c: 2 } },
        { s: { r: 9, c: 3 }, e: { r: 10, c: 3 } },
        { s: { r: 9, c: 4 }, e: { r: 10, c: 4 } },
        { s: { r: 9, c: 5 }, e: { r: 10, c: 5 } },
        { s: { r: 9, c: 6 }, e: { r: 10, c: 6 } },
        { s: { r: 9, c: 7 }, e: { r: 9, c: 9 } },
        { s: { r: 8, c: 10 }, e: { r: 8, c: 12 } },
        { s: { r: 9, c: 10 }, e: { r: 10, c: 10 } },
        { s: { r: 9, c: 11 }, e: { r: 10, c: 11 } },
        { s: { r: 9, c: 12 }, e: { r: 10, c: 12 } },
        { s: { r: 8, c: 13 }, e: { r: 10, c: 13 } }
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
                    border: borderThin,
                    font: { bold: isHeader, sz: 10 },
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
    const excelBuffer = XLSX.write(wb, { bookType: "xlsx", type: "array" });
    const blob = new Blob([excelBuffer], { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" });
    saveAs(blob, "RKBMD_Gabungan_Pengadaan_dan_Pemeliharaan.xlsx");
}