import * as XLSX from "xlsx-js-style";
import { saveAs } from "file-saver";
import { ListPemeliharaan, ListPengadaan } from "@/types/rkbmd";
import { Perekon } from "@/app/admin/rkbmd-ba/page";
import { RkbmdBaContract } from "@/action/rkbmdBa/rkbmd-ba-contract";

/**
 * Fungsi Gabungan untuk Mengekspor Rencana Pengadaan dan Rencana Pemeliharaan
 * ke dalam satu file Excel dengan dua sheet terpisah.
 */
export async function exportBADesk(
    pengadaanData: ListPengadaan[],
    pemeliharaanData: (ListPemeliharaan)[],
    perekon: Perekon,
    rkbmdBA: RkbmdBaContract.SelectDTO,
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

    rowsPengadaan.push(["HASIL PENELAAHAN RENCANA KEBUTUHAN PENGADAAN BMD"]);
    rowsPengadaan.push(["(RENCANA PENGADAAN)"]);
    rowsPengadaan.push(["PENGGUNA BARANG " + rkbmdBA.perangkatDaerah]);
    rowsPengadaan.push(["TAHUN 2027"]);
    rowsPengadaan.push([]);
    rowsPengadaan.push(["PROVINSI", "", ": JAWA TIMUR"]);
    rowsPengadaan.push(["KABUPATEN", "", ": PASURUAN"]);
    rowsPengadaan.push([]);
    rowsPengadaan.push([
        "No", "Program / Kegiatan / Output", "Usulan Barang Milik Daerah", "", "", "",
        "Kebutuhan Maksimum", "", "Data Daftar Barang Yang Dapat Dioptimalkan", "", "", "",
        "Kebutuhan Riil Barang Milik Daerah", "", "Rencana Kebutuhan BMD Yang Disetujui", "", "Cara Pemenuhan", "Ket"
    ]);
    rowsPengadaan.push([
        "", "", "Kode Barang", "Nama Barang", "Jumlah", "Satuan",
        "Jumlah", "Satuan", "Kode Barang", "Nama Barang", "Jumlah", "Satuan",
        "Jumlah", "Satuan", "Jumlah", "Satuan", ""
    ]);
    rowsPengadaan.push(["1", "2", "3", "4", "5", "6", "7", "8", "9", "10", "11", "12", "13", "14", "15", "16", "17", "18"]);

    let pengIdx = 0;
    for (const [pengguna, kuasas] of Object.entries(groupedPengadaan)) {
        rowsPengadaan.push(["", `${getRoman(pengIdx)}. ${pengguna}`, "", "", "", "", "", "", "", "", "", "", "", "", "", "", "", "", ""]);

        let kuasaIdxP = 1;
        for (const [kuasa, programs] of Object.entries(kuasas as Record<string, any>)) {
            const isKuasaEmpty = !kuasa || kuasa.trim() === "" || kuasa === "-" || kuasa === "null";
            if (!isKuasaEmpty) {
                rowsPengadaan.push(["", `     ${kuasaIdxP}. ${kuasa}`, "", "", "", "", "", "", "", "", "", "", "", "", "", "", "", ""]);
                kuasaIdxP++;
            }

            let progIdx = 0;
            for (const [program, kegiatans] of Object.entries(programs as Record<string, any>)) {
                rowsPengadaan.push(["", `         ${getAlpha(progIdx)}. ${program}`, "", "", "", "", "", "", "", "", "", "", "", "", "", "", "", ""]);

                let kegIdx = 1;
                for (const [kegiatan, outputs] of Object.entries(kegiatans as Record<string, any>)) {
                    rowsPengadaan.push(["", `             ${kegIdx}). ${kegiatan}`, "", "", "", "", "", "", "", "", "", "", "", "", "", "", "", ""]);

                    let outIdx = 0;
                    for (const [output, items] of Object.entries(outputs as Record<string, any>)) {
                        rowsPengadaan.push(["", `                 ${getLowerAlpha(outIdx)}. ${output}`, "", "", "", "", "", "", "", "", "", "", "", "", "", "", "", ""]);

                        for (const item of items as ListPengadaan[]) {
                            rowsPengadaan.push([
                                "", "",
                                item.usulan?.kodeBarang || "-", item.usulan?.namaBarang || "-", item.usulan?.jumlah || "-", item.usulan?.satuan || "-",
                                "-", "-",
                                item.bmdBisaDioptimalkan?.kodeBarang || "-", item.bmdBisaDioptimalkan?.namaBarang || "-", item.bmdBisaDioptimalkan?.jumlah || "-", item.bmdBisaDioptimalkan?.satuan || "-",
                                item.kebutuhanRiil?.jumlah || "-", item.kebutuhanRiil?.satuan || "-", item.kebutuhanRiil?.jumlah || "-", item.kebutuhanRiil?.satuan || "-", "", ""
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

    const startPemeriksaRow = rowsPengadaan.length;
    rowsPengadaan.push(["", "", "", "", "", "", "", "", "", "", "", "", "", "Pasuruan,"]);
    rowsPengadaan.push(["", "", "", "", "", "", "", "", "", "", "", "", "", "Disetujui"]);
    rowsPengadaan.push(["", "", "", "", "", "", "", "", "", "", "", "", "", "Pengelola Barang"]);
    rowsPengadaan.push(["Telah Diperiksa", "", "", "", "", "", "", "", "", "", "", "", "", ""]);
    rowsPengadaan.push(["No", "Nama", "Jabatan", "", "", "", "Paraf", "Tanggal"])
    rowsPengadaan.push(["1", "Yuswianto,S.E.,M.M.", "Pejabat Penatausahaan Pengelola Barang", "", "", "", "", "", "", "", "", "", "", "YUDHA TRIWIDYA SASONGKO, S.Sos, M.Si"])
    rowsPengadaan.push(["2", "Dian Prasetyo,S.E.,M.M.", "Pengurus Barang Pengelola", "", "", "", "", "", "", "", "", "", "", "NIP. 197405171993111001"])

    const wsPengadaan = XLSX.utils.aoa_to_sheet(rowsPengadaan);
    wsPengadaan["!cols"] = [
        { wch: 2 },  // A
        { wch: 30 }, // B
        { wch: 7 }, // C
        { wch: 15 }, // D
        { wch: 5 },  // E
        { wch: 5 }, // F
        { wch: 5 },  // G
        { wch: 5 }, // H
        { wch: 7 }, // I
        { wch: 15 }, // J
        { wch: 5 },  // K
        { wch: 5 }, // L
        { wch: 5 },  // M
        { wch: 5 }, // N
        { wch: 5 }, // O
        { wch: 5 },  // P
        { wch: 8 }, // Q
        { wch: 5 }  // R
    ];
    wsPengadaan["!merges"] = [
        // merge title
        { s: { r: 0, c: 0 }, e: { r: 0, c: 17 } },
        { s: { r: 1, c: 0 }, e: { r: 1, c: 17 } },
        { s: { r: 2, c: 0 }, e: { r: 2, c: 17 } },
        { s: { r: 3, c: 0 }, e: { r: 3, c: 17 } },
        { s: { r: 5, c: 0 }, e: { r: 5, c: 1 } },
        { s: { r: 5, c: 2 }, e: { r: 5, c: 3 } },
        { s: { r: 6, c: 0 }, e: { r: 6, c: 1 } },
        { s: { r: 6, c: 2 }, e: { r: 6, c: 3 } },
        { s: { r: 8, c: 0 }, e: { r: 9, c: 0 } }, { s: { r: 8, c: 1 }, e: { r: 9, c: 1 } },
        { s: { r: 8, c: 2 }, e: { r: 8, c: 5 } }, { s: { r: 8, c: 6 }, e: { r: 8, c: 7 } },
        { s: { r: 8, c: 8 }, e: { r: 8, c: 11 } }, { s: { r: 8, c: 12 }, e: { r: 8, c: 13 } },
        { s: { r: 8, c: 14 }, e: { r: 8, c: 15 } },
        { s: { r: 8, c: 16 }, e: { r: 9, c: 16 } },
        { s: { r: 8, c: 17 }, e: { r: 9, c: 17 } },
        { s: { r: startPemeriksaRow + 3, c: 0 }, e: { r: startPemeriksaRow + 3, c: 1 } },
        { s: { r: startPemeriksaRow + 4, c: 2 }, e: { r: startPemeriksaRow + 4, c: 5 } },
        { s: { r: startPemeriksaRow + 5, c: 2 }, e: { r: startPemeriksaRow + 5, c: 5 } },
        { s: { r: startPemeriksaRow + 6, c: 2 }, e: { r: startPemeriksaRow + 6, c: 5 } },
        { s: { r: startPemeriksaRow + 4, c: 7 }, e: { r: startPemeriksaRow + 4, c: 8 } },
        { s: { r: startPemeriksaRow + 5, c: 7 }, e: { r: startPemeriksaRow + 5, c: 8 } },
        { s: { r: startPemeriksaRow + 6, c: 7 }, e: { r: startPemeriksaRow + 6, c: 8 } },
        { s: { r: startPemeriksaRow + 0, c: 13 }, e: { r: startPemeriksaRow + 0, c: 17 } },
        { s: { r: startPemeriksaRow + 1, c: 13 }, e: { r: startPemeriksaRow + 1, c: 17 } },
        { s: { r: startPemeriksaRow + 2, c: 13 }, e: { r: startPemeriksaRow + 2, c: 17 } },
        { s: { r: startPemeriksaRow + 3, c: 13 }, e: { r: startPemeriksaRow + 3, c: 17 } },
        { s: { r: startPemeriksaRow + 4, c: 13 }, e: { r: startPemeriksaRow + 4, c: 17 } },
        { s: { r: startPemeriksaRow + 5, c: 13 }, e: { r: startPemeriksaRow + 5, c: 17 } },
        { s: { r: startPemeriksaRow + 6, c: 13 }, e: { r: startPemeriksaRow + 6, c: 17 } },

    ];
    wsPengadaan["!rows"] = [];
    wsPengadaan["!rows"][8] = { hpt: 30 };  // header utama


    for (let R = 0; R < rowsPengadaan.length; ++R) {
        for (let C = 0; C < 18; ++C) {
            const cellRef = XLSX.utils.encode_cell({ r: R, c: C });
            if (!wsPengadaan[cellRef]) wsPengadaan[cellRef] = { t: "s", v: "" };
            if (R <= 4) {
                wsPengadaan[cellRef].s = { font: { bold: true, sz: 11 }, alignment: { horizontal: "center", vertical: "center" } };
            } else if (R >= 8 && R < endIdxPengadaan) {
                const isHeader = R <= 10;
                wsPengadaan[cellRef].s = {
                    border: borderThin, font: { bold: isHeader, sz: 7 },
                    alignment: {
                        vertical: "center",
                        horizontal: isHeader ? "center" : (C === 0 || (C >= 4 && C <= 7) || (C >= 10 && C <= 13)) ? "center" : "left",
                        wrapText: true
                    }
                };
            } else if (R >= endIdxPengadaan) {
                wsPengadaan[cellRef].s = { font: { sz: 10 } }
                if (
                    R >= startPemeriksaRow + 4 &&
                    R <= startPemeriksaRow + 7 &&
                    C >= 0 &&
                    C <= 8
                ) {
                    wsPengadaan[cellRef].s.border = borderThin;
                }
                if (R == startPemeriksaRow + 4 && C <= 8) {
                    wsPengadaan[cellRef].s.alignment = { horizontal: "center" };
                }
            }
        }
    }
    const yudhaRowP = startPemeriksaRow + 5;
    const yudhaColP = 13; // kolom N
    const yudhaRefP = XLSX.utils.encode_cell({ r: yudhaRowP, c: yudhaColP });
    if (wsPengadaan[yudhaRefP]) {
        wsPengadaan[yudhaRefP].s = {
            ...wsPengadaan[yudhaRefP].s,
            font: { sz: 10, bold: true, underline: true },
            alignment: { horizontal: "center" },
        };
    }
    XLSX.utils.book_append_sheet(wb, wsPengadaan, "PENGADAAN");


    // ============================================================================
    // 2. PROSES DATA & SHEET: PEMELIHARAAN
    // ============================================================================
    const groupedPemeliharaan: Record<string, any> = {};

    pemeliharaanData.forEach((item) => {
        const { penggunaBarang, kuasaPenggunaBarang, program, kegiatan, output } = item;
        if (!groupedPemeliharaan[penggunaBarang]) groupedPemeliharaan[penggunaBarang] = {};
        if (!groupedPemeliharaan[penggunaBarang][kuasaPenggunaBarang]) groupedPemeliharaan[penggunaBarang][kuasaPenggunaBarang] = {};
        if (!groupedPemeliharaan[penggunaBarang][kuasaPenggunaBarang][program]) groupedPemeliharaan[penggunaBarang][kuasaPenggunaBarang][program] = {};
        if (!groupedPemeliharaan[penggunaBarang][kuasaPenggunaBarang][program][kegiatan]) groupedPemeliharaan[penggunaBarang][kuasaPenggunaBarang][program][kegiatan] = {};
        if (!groupedPemeliharaan[penggunaBarang][kuasaPenggunaBarang][program][kegiatan][output]) groupedPemeliharaan[penggunaBarang][kuasaPenggunaBarang][program][kegiatan][output] = [];
        groupedPemeliharaan[penggunaBarang][kuasaPenggunaBarang][program][kegiatan][output].push(item);
    });

    const rowsPemeliharaan: any[][] = [];

    // --- HEADER (sama persis dgn pengadaan) ---
    rowsPemeliharaan.push(["HASIL PENELAAHAN RENCANA KEBUTUHAN PEMELIHARAAN BMD"]);                      // r0
    rowsPemeliharaan.push(["(RENCANA PEMELIHARAAN)"]);                                      // r1
    rowsPemeliharaan.push(["PENGGUNA BARANG " + rkbmdBA.perangkatDaerah]);                 // r2  ← pakai rkbmdBA, bukan pemeliharaanData[0]
    rowsPemeliharaan.push(["TAHUN 2027"]);                                                  // r3
    rowsPemeliharaan.push([]);                                                              // r4
    rowsPemeliharaan.push(["PROVINSI", "", ": JAWA TIMUR"]);                               // r5  ← format sama dgn pengadaan (col 2, bukan 1)
    rowsPemeliharaan.push(["KABUPATEN", "", ": PASURUAN"]);                                // r6
    rowsPemeliharaan.push([]);                                                              // r7

    // --- HEADER KOLOM (3 baris) ---
    rowsPemeliharaan.push([                                                                 // r8
        "No.", "Program / Kegiatan / Output",
        "Barang Yang Dipelihara", "", "", "", "", "", "", "",
        "Usulan Kebutuhan Pemeliharaan", "", "",
        "Rencana Kebutuhan Pemeliharaan BMD (Yang Disetujui)", "", "Keterangan"
    ]);
    rowsPemeliharaan.push([                                                                 // r9
        "", "",
        "Kode Barang", "Nama Barang", "Jumlah", "Satuan", "Status Barang", "Kondisi Barang", "", "",
        "Nama Pemeliharaan", "Jumlah", "Satuan",
        "Jumlah", "Satuan", ""
    ]);
    rowsPemeliharaan.push(["", "", "", "", "", "", "", "B", "RR", "RB", "", "", "", "", "", ""]); // r10
    rowsPemeliharaan.push(["1", "2", "3", "4", "5", "6", "7", "8", "9", "10", "11", "12", "13", "14", "15", "16"]); // r11

    // --- DATA ROWS ---
    let pengIdxM = 0;
    for (const [pengguna, kuasas] of Object.entries(groupedPemeliharaan)) {
        rowsPemeliharaan.push(["", `${getRoman(pengIdxM)}. ${pengguna}`, "", "", "", "", "", "", "", "", "", "", "", "", "", ""]);

        let kuasaIdxM = 1;
        for (const [kuasa, programs] of Object.entries(kuasas as Record<string, any>)) {
            const isKuasaEmpty = !kuasa || kuasa.trim() === "" || kuasa === "-" || kuasa === "null";
            if (!isKuasaEmpty) {
                rowsPemeliharaan.push(["", `     ${kuasaIdxM}. ${kuasa}`, "", "", "", "", "", "", "", "", "", "", "", "", "", ""]);
                kuasaIdxM++;
            }

            let progIdx = 0;
            for (const [program, kegiatans] of Object.entries(programs as Record<string, any>)) {
                rowsPemeliharaan.push(["", `         ${getAlpha(progIdx)}. ${program}`, "", "", "", "", "", "", "", "", "", "", "", "", "", ""]);

                let kegIdx = 1;
                for (const [kegiatan, outputs] of Object.entries(kegiatans as Record<string, any>)) {
                    rowsPemeliharaan.push(["", `             ${kegIdx}). ${kegiatan}`, "", "", "", "", "", "", "", "", "", "", "", "", "", ""]);

                    let outIdx = 0;
                    for (const [output, items] of Object.entries(outputs as Record<string, any>)) {
                        rowsPemeliharaan.push(["", `                 ${getLowerAlpha(outIdx)}. ${output}`, "", "", "", "", "", "", "", "", "", "", "", "", "", ""]);

                        for (const item of items as any[]) {
                            const kodeBrg = item.bmd?.kodeBarang || item.kodeBarang || "-";
                            const namaBrg = item.bmd?.namaBarang || item.namaBarang || "-";
                            const jmlTersedia = item.bmd?.jumlah || item.jumlahTersedia || "-";
                            const satTersedia = item.bmd?.satuan || item.satuan || "-";
                            const nmPemeliharaan = item.usulanPemeliharaan?.namaPemeliharaan || item.namaPemeliharaan || "-";
                            const jmlPemeliharaan = item.usulanPemeliharaan?.jumlah || item.jumlah || "-";
                            const satPemeliharaan = item.usulanPemeliharaan?.satuan || item.bmd?.satuan || "-";
                            const ket = item.keterangan || "";

                            rowsPemeliharaan.push([
                                "", "",
                                kodeBrg, namaBrg, jmlTersedia, satTersedia,
                                "Milik Sendiri", "v", "", "",
                                nmPemeliharaan, jmlPemeliharaan, satTersedia,
                                jmlPemeliharaan, satTersedia, ket
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

    // --- FOOTER: paraf periksa + tanda tangan (identik dgn pengadaan) ---
    rowsPemeliharaan.push([]);  // spasi 1
    rowsPemeliharaan.push([]);  // spasi 2

    const startPemeriksaRowM = rowsPemeliharaan.length;
    rowsPemeliharaan.push(["", "", "", "", "", "", "", "", "", "", "", "Pasuruan,"]);
    rowsPemeliharaan.push(["", "", "", "", "", "", "", "", "", "", "", "Disetujui"]);
    rowsPemeliharaan.push(["", "", "", "", "", "", "", "", "", "", "", "Pengelola Barang"]);
    rowsPemeliharaan.push(["Telah Diperiksa", "", "", "", "", "", "", "", "", "", "", "", "", ""]);
    rowsPemeliharaan.push(["No", "Nama", "Jabatan", "", "", "", "Paraf", "Tanggal"]);
    rowsPemeliharaan.push(["1", "Yuswianto,S.E.,M.M.", "Pejabat Penatausahaan Pengelola Barang", "", "", "", "", "", "", "", "", "YUDHA TRIWIDYA SASONGKO, S.Sos, M.Si"]);
    rowsPemeliharaan.push(["2", "Dian Prasetyo,S.E.,M.M.", "Pengurus Barang Pengelola", "", "", "", "", "", "", "", "", "NIP. 197405171993111001"]);

    // --- WORKSHEET ---
    const wsPemeliharaan = XLSX.utils.aoa_to_sheet(rowsPemeliharaan);

    wsPemeliharaan["!cols"] = [
        { wch: 2 },  // A  No
        { wch: 35 }, // B  Program/Kegiatan
        { wch: 7 },  // C  Kode Barang
        { wch: 15 }, // D  Nama Barang
        { wch: 5 },  // E  Jumlah
        { wch: 5 },  // F  Satuan
        { wch: 12 }, // G  Status Barang
        { wch: 4 },  // H  B
        { wch: 4 },  // I  RR
        { wch: 4 },  // J  RB
        { wch: 18 }, // K  Nama Pemeliharaan
        { wch: 5 },  // L  Jumlah Usulan
        { wch: 5 },  // M  Satuan Usulan
        { wch: 5 },  // N  Jumlah Disetujui
        { wch: 5 },  // O  Satuan Disetujui
        { wch: 10 },  // P  Keterangan
    ];

    wsPemeliharaan["!merges"] = [
        // Title
        { s: { r: 0, c: 0 }, e: { r: 0, c: 15 } },
        { s: { r: 1, c: 0 }, e: { r: 1, c: 15 } },
        { s: { r: 2, c: 0 }, e: { r: 2, c: 15 } },
        { s: { r: 3, c: 0 }, e: { r: 3, c: 15 } },
        // PROVINSI / KABUPATEN  (sama dgn pengadaan: col0-1, col2-3)
        { s: { r: 5, c: 0 }, e: { r: 5, c: 1 } },
        { s: { r: 5, c: 2 }, e: { r: 5, c: 3 } },
        { s: { r: 6, c: 0 }, e: { r: 6, c: 1 } },
        { s: { r: 6, c: 2 }, e: { r: 6, c: 3 } },
        // Header kolom r8
        { s: { r: 8, c: 0 }, e: { r: 10, c: 0 } },   // No.
        { s: { r: 8, c: 1 }, e: { r: 10, c: 1 } },   // Program/Kegiatan
        { s: { r: 8, c: 2 }, e: { r: 8, c: 9 } },    // Barang Yang Dipelihara (span)
        { s: { r: 9, c: 2 }, e: { r: 10, c: 2 } },   // Kode Barang
        { s: { r: 9, c: 3 }, e: { r: 10, c: 3 } },   // Nama Barang
        { s: { r: 9, c: 4 }, e: { r: 10, c: 4 } },   // Jumlah
        { s: { r: 9, c: 5 }, e: { r: 10, c: 5 } },   // Satuan
        { s: { r: 9, c: 6 }, e: { r: 10, c: 6 } },   // Status Barang
        { s: { r: 9, c: 7 }, e: { r: 9, c: 9 } },    // Kondisi Barang (B/RR/RB)
        { s: { r: 8, c: 10 }, e: { r: 8, c: 12 } },  // Usulan Kebutuhan Pemeliharaan
        { s: { r: 9, c: 10 }, e: { r: 10, c: 10 } }, // Nama Pemeliharaan
        { s: { r: 9, c: 11 }, e: { r: 10, c: 11 } }, // Jumlah
        { s: { r: 9, c: 12 }, e: { r: 10, c: 12 } }, // Satuan
        { s: { r: 8, c: 13 }, e: { r: 8, c: 14 } },  // Rencana Yang Disetujui
        { s: { r: 9, c: 13 }, e: { r: 10, c: 13 } }, // Jumlah Disetujui
        { s: { r: 9, c: 14 }, e: { r: 10, c: 14 } }, // Satuan Disetujui
        { s: { r: 8, c: 15 }, e: { r: 10, c: 15 } }, // Keterangan
        // Footer periksa (mirror pengadaan, disesuaikan ke 16 kolom)
        { s: { r: startPemeriksaRowM + 3, c: 0 }, e: { r: startPemeriksaRowM + 3, c: 1 } },
        { s: { r: startPemeriksaRowM + 4, c: 2 }, e: { r: startPemeriksaRowM + 4, c: 5 } },
        { s: { r: startPemeriksaRowM + 5, c: 2 }, e: { r: startPemeriksaRowM + 5, c: 5 } },
        { s: { r: startPemeriksaRowM + 6, c: 2 }, e: { r: startPemeriksaRowM + 6, c: 5 } },
        { s: { r: startPemeriksaRowM + 4, c: 7 }, e: { r: startPemeriksaRowM + 4, c: 8 } },
        { s: { r: startPemeriksaRowM + 5, c: 7 }, e: { r: startPemeriksaRowM + 5, c: 8 } },
        { s: { r: startPemeriksaRowM + 6, c: 7 }, e: { r: startPemeriksaRowM + 6, c: 8 } },
        { s: { r: startPemeriksaRowM + 0, c: 11 }, e: { r: startPemeriksaRowM + 0, c: 15 } },
        { s: { r: startPemeriksaRowM + 1, c: 11 }, e: { r: startPemeriksaRowM + 1, c: 15 } },
        { s: { r: startPemeriksaRowM + 2, c: 11 }, e: { r: startPemeriksaRowM + 2, c: 15 } },
        { s: { r: startPemeriksaRowM + 3, c: 11 }, e: { r: startPemeriksaRowM + 3, c: 15 } },
        { s: { r: startPemeriksaRowM + 4, c: 11 }, e: { r: startPemeriksaRowM + 4, c: 15 } },
        { s: { r: startPemeriksaRowM + 5, c: 11 }, e: { r: startPemeriksaRowM + 5, c: 15 } },
        { s: { r: startPemeriksaRowM + 6, c: 11 }, e: { r: startPemeriksaRowM + 6, c: 15 } },
    ];

    wsPemeliharaan["!rows"] = [];
    wsPemeliharaan["!rows"][8] = { hpt: 50 }; // header utama

    // --- STYLING ---
    for (let R = 0; R < rowsPemeliharaan.length; ++R) {
        for (let C = 0; C < 16; ++C) {
            const cellRef = XLSX.utils.encode_cell({ r: R, c: C });
            if (!wsPemeliharaan[cellRef]) wsPemeliharaan[cellRef] = { t: "s", v: "" };

            if (R <= 4) {
                wsPemeliharaan[cellRef].s = {
                    font: { bold: true, sz: 11 },
                    alignment: { horizontal: "center", vertical: "center" }
                };
            } else if (R >= 8 && R < endIdxPemeliharaan) {
                const isHeader = R <= 11;
                wsPemeliharaan[cellRef].s = {
                    border: borderThin,
                    font: { bold: isHeader, sz: 7 },
                    alignment: {
                        vertical: "center",
                        horizontal: isHeader
                            ? "center"
                            : (C === 0 || (C >= 4 && C <= 9) || C === 11 || C === 12 || C === 13 || C === 14)
                                ? "center"
                                : "left",
                        wrapText: true
                    }
                };
            } else if (R >= endIdxPemeliharaan) {
                wsPemeliharaan[cellRef].s = { font: { sz: 10 } };
                if (
                    R >= startPemeriksaRowM + 4 &&
                    R <= startPemeriksaRowM + 6 &&
                    C >= 0 && C <= 8
                ) {
                    wsPemeliharaan[cellRef].s.border = borderThin;
                }
                if (R === startPemeriksaRowM + 4 && C <= 8) {
                    wsPemeliharaan[cellRef].s.alignment = { horizontal: "center" };
                }
            }
        }
    }


    const yudhaRowM = startPemeriksaRowM + 5;
    const yudhaColM = 11; // kolom L (tanda tangan ada di col 11 di sheet pemeliharaan)
    const yudhaRefM = XLSX.utils.encode_cell({ r: yudhaRowM, c: yudhaColM });
    if (wsPemeliharaan[yudhaRefM]) {
        wsPemeliharaan[yudhaRefM].s = {
            ...wsPemeliharaan[yudhaRefM].s,
            font: { sz: 10, bold: true, underline: true },
            alignment: { horizontal: "center" },
        };
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
    saveAs(blob, `PENELAAHAN ${rkbmdBA.perangkatDaerah}.xlsx`);
}