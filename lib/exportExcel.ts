import * as XLSX from "xlsx-js-style";
import { saveAs } from "file-saver";
import { FormPemeliharaanData } from "@/app/create/addData";

export async function exportPemeliharaanToExcel(data: FormPemeliharaanData[]) {
    // 1. KELOMPOKKAN DATA 
    const grouped: Record<string, any> = {};
    data.forEach((item) => {
        const { kuasaPenggunaBarang, program, kegiatan, output } = item;
        if (!grouped[kuasaPenggunaBarang]) grouped[kuasaPenggunaBarang] = {};
        if (!grouped[kuasaPenggunaBarang][program]) grouped[kuasaPenggunaBarang][program] = {};
        if (!grouped[kuasaPenggunaBarang][program][kegiatan]) grouped[kuasaPenggunaBarang][program][kegiatan] = {};
        if (!grouped[kuasaPenggunaBarang][program][kegiatan][output]) grouped[kuasaPenggunaBarang][program][kegiatan][output] = [];
        grouped[kuasaPenggunaBarang][program][kegiatan][output].push(item);
    });

    const rows: any[][] = [];

    // --- BAGIAN JUDUL (Baris 1 - 8) ---
    rows.push(["RENCANA KEBUTUHAN BARANG MILIK DAERAH"]);
    rows.push(["(RENCANA PEMELIHARAAN)"]);
    rows.push(["PENGGUNA BARANG", ":", "................(2)"]);
    rows.push(["TAHUN ANGGARAN", ":", "2027"]);
    rows.push([]);
    rows.push(["KAB/KOTA", ":", "PASURUAN"]);
    rows.push(["PROVINSI", ":", "JAWA TIMUR"]);
    rows.push([]);

    // --- BAGIAN HEADER TABEL (Baris 9 - 12) ---
    // Baris 9
    rows.push([
        "No.", "Kuasa Pengguna Barang/Program/Kegiatan/Output", "Barang Yang Dipelihara", "", "", "", "", "", "", "",
        "Usulan Kebutuhan Pemeliharaan", "", "", "Keterangan"
    ]);
    // Baris 10
    rows.push([
        "", "", "Kode Barang", "Nama Barang", "Jumlah", "Satuan", "Status Barang", "Kondisi Barang", "", "",
        "Nama Pemeliharaan", "Jumlah", "Satuan", ""
    ]);
    // Baris 11
    rows.push([
        "", "", "", "", "", "", "", "B", "RR", "RB", "", "", "", ""
    ]);
    // Baris 12 (Nomor Kolom)
    rows.push(["1", "2", "3", "4", "5", "6", "7", "8", "9", "10", "11", "12", "13", "14"]);

    const dataStartIndex = rows.length;

    // --- BAGIAN DATA ---
    const getAlpha = (i: number) => String.fromCharCode(65 + i);
    const getLowerAlpha = (i: number) => String.fromCharCode(97 + i);

    let kuasaIndex = 1;
    for (const [kuasa, programs] of Object.entries(grouped)) {
        rows.push(["", `${kuasaIndex}. ${kuasa}`, "", "", "", "", "", "", "", "", "", "", "", ""]);
        let progIndex = 0;
        for (const [program, kegiatans] of Object.entries(programs as Record<string, any>)) {
            rows.push(["", `     ${getAlpha(progIndex)}. ${program}`, "", "", "", "", "", "", "", "", "", "", "", ""]);
            let kegIndex = 1;
            for (const [kegiatan, outputs] of Object.entries(kegiatans as Record<string, any>)) {
                rows.push(["", `          ${kegIndex}). ${kegiatan}`, "", "", "", "", "", "", "", "", "", "", "", ""]);
                let outIndex = 0;
                for (const [output, items] of Object.entries(outputs as Record<string, any>)) {
                    rows.push(["", `               ${getLowerAlpha(outIndex)}. ${output}`, "", "", "", "", "", "", "", "", "", "", "", ""]);
                    for (const item of items as FormPemeliharaanData[]) {
                        rows.push([
                            "", "",
                            item.kodeBarang, item.namaBarang, item.jumlahTersedia, item.satuan,
                            "Milik Sendiri", "v", "", "",
                            item.namaPemeliharaan, item.jumlah, item.satuan, ""
                        ]);
                    }
                    outIndex++;
                }
                kegIndex++;
            }
            progIndex++;
        }
        kuasaIndex++;
    }

    const dataEndIndex = rows.length;

    // --- BAGIAN TANDA TANGAN (Sesuai Template) ---
    rows.push([]);
    rows.push([]);
    rows.push(["", "", "", "", "", "", "", "", "", "", ".................., .................................... (21)"]);
    rows.push(["", "", "", "", "", "", "", "", "", "", "PENGGUNA BARANG………(22)"]);
    rows.push([]);
    rows.push([]);
    rows.push([]);
    rows.push(["", "", "", "", "", "", "", "", "", "", "..........................................................(23)"]);
    rows.push(["", "", "", "", "", "", "", "", "", "", "NIP ………………………….………… (23)"]);
    rows.push([]);

    // --- BAGIAN PETUNJUK PENGISIAN ---
    rows.push(["Petunjuk Pengisian"]);
    rows.push(["(1)", "Diisi nomor halaman."]);
    rows.push(["(2)", "Diisi nama pengguna barang."]);
    rows.push(["(3)", "Diisi tahun anggaran RKBMD yang diusulkan."]);
    rows.push(["(4)", "Disi nama Pemerintah Provinsi."]);
    rows.push(["(5)", "Disi nama Pemerintah Kabupaten/Kota."]);
    rows.push(["(6)", "Diisi no urut."]);
    rows.push(["(7)", "Diisi Kuasa Pengguna Barang/Program/Kegiatan/Output berdasarkan rencana kerja SKPD."]);
    rows.push(["(8)", "Diisi kode barang berdasarkan ketentuan penggolongan dan kodefikasi Barang Milik Daerah yang berlaku."]);
    rows.push(["(9)", "Diisi nama barang sesuai kolom (8)."]);
    rows.push(["(10)", "Diisi kuantitas barang yang diusulkan."]);
    rows.push(["(11)", "Diisi satuan barang yang dipelihara (m, m², unit, buah, set, dsb)."]);
    rows.push(["(12)", "Diisi status barang milik daerah yang pemeliharaannya dibiayai APBD."]);
    rows.push(["(13)", "Diisi 'v' jika kondisi barang Baik (B)."]);
    rows.push(["(14)", "Diisi 'v' jika kondisi barang Rusak Ringan (RR)."]);
    rows.push(["(15)", "Diisi 'v' jika kondisi barang Rusak Berat (RB)."]);
    rows.push(["(16)", "Diisi uraian nama pemeliharaan."]);
    rows.push(["(17)", "Diisi kuantitas barang yang diusulkan dipelihara."]);
    rows.push(["(18)", "Diisi satuan barang yang diusulkan dipelihara."]);
    rows.push(["(19)", "Diisi keterangan penting lainnya."]);
    rows.push(["(20)", "Diisi tempat dan tanggal disahkan."]);
    rows.push(["(21)", "Diisi jabatan Pengguna Barang yang menandatangani."]);

    // 3. BUAT WORKSHEET & WORKBOOK
    const ws = XLSX.utils.aoa_to_sheet(rows);

    // Konfigurasi Lebar Kolom (Width)
    ws["!cols"] = [
        { wch: 5 },   // A: No
        { wch: 45 },  // B: Kuasa Pengguna... (Dibuat lebar agar hierarki muat)
        { wch: 18 },  // C: Kode Barang
        { wch: 30 },  // D: Nama Barang
        { wch: 8 },   // E: Jumlah
        { wch: 10 },  // F: Satuan
        { wch: 15 },  // G: Status
        { wch: 5 },   // H: Kondisi B
        { wch: 5 },   // I: Kondisi RR
        { wch: 5 },   // J: Kondisi RB
        { wch: 25 },  // K: Nama Pemeliharaan
        { wch: 8 },   // L: Jumlah
        { wch: 10 },  // M: Satuan
        { wch: 18 }   // N: Keterangan
    ];

    // Merge Cells untuk Judul & Header Tabel
    ws["!merges"] = [
        // Merge Judul Atas
        { s: { r: 0, c: 0 }, e: { r: 0, c: 13 } }, // RENCANA KEBUTUHAN
        { s: { r: 1, c: 0 }, e: { r: 1, c: 13 } }, // (RENCANA PEMELIHARAAN)

        // Merge Header Tabel (Sesuai dengan baris/row index)
        { s: { r: 8, c: 0 }, e: { r: 10, c: 0 } },  // No. (A9:A11)
        { s: { r: 8, c: 1 }, e: { r: 10, c: 1 } },  // Kuasa Pengguna Barang (B9:B11)
        { s: { r: 8, c: 2 }, e: { r: 8, c: 9 } },   // Barang Yang Dipelihara (C9:J9)
        { s: { r: 9, c: 2 }, e: { r: 10, c: 2 } },  // Kode Barang (C10:C11)
        { s: { r: 9, c: 3 }, e: { r: 10, c: 3 } },  // Nama Barang (D10:D11)
        { s: { r: 9, c: 4 }, e: { r: 10, c: 4 } },  // Jumlah (E10:E11)
        { s: { r: 9, c: 5 }, e: { r: 10, c: 5 } },  // Satuan (F10:F11)
        { s: { r: 9, c: 6 }, e: { r: 10, c: 6 } },  // Status Barang (G10:G11)
        { s: { r: 9, c: 7 }, e: { r: 9, c: 9 } },   // Kondisi Barang (H10:J10)
        { s: { r: 8, c: 10 }, e: { r: 8, c: 12 } }, // Usulan Kebutuhan Pemeliharaan (K9:M9)
        { s: { r: 9, c: 10 }, e: { r: 10, c: 10 } },// Nama Pemeliharaan (K10:K11)
        { s: { r: 9, c: 11 }, e: { r: 10, c: 11 } },// Jumlah (L10:L11)
        { s: { r: 9, c: 12 }, e: { r: 10, c: 12 } },// Satuan (M10:M11)
        { s: { r: 8, c: 13 }, e: { r: 10, c: 13 } } // Keterangan (N9:N11)
    ];

    // 4. STYLING SELURUH CELL
    const borderThin = {
        top: { style: "thin" }, bottom: { style: "thin" },
        left: { style: "thin" }, right: { style: "thin" }
    };

    // Loop semua baris untuk applying style spesifik
    for (let R = 0; R < rows.length; ++R) {
        for (let C = 0; C < 14; ++C) {
            const cellRef = XLSX.utils.encode_cell({ r: R, c: C });
            if (!ws[cellRef]) ws[cellRef] = { t: "s", v: "" };

            // Style untuk Judul Atas
            if (R === 0 || R === 1) {
                ws[cellRef].s = {
                    font: { bold: true, sz: 12 },
                    alignment: { horizontal: "center", vertical: "center" }
                };
            }
            // Style untuk Bagian KAB/KOTA dsb
            else if (R >= 2 && R <= 6) {
                ws[cellRef].s = { font: { bold: true, sz: 11 } };
            }
            // Style untuk Tabel Header & Data
            else if (R >= 8 && R < dataEndIndex) {
                const isHeader = R <= 11; // Baris 9, 10, 11, 12 (Angka urut)
                ws[cellRef].s = {
                    border: borderThin,
                    font: { bold: isHeader, sz: 10 },
                    alignment: {
                        vertical: "center",
                        // Header dan Nomor Urut di-tengah, sisanya tergantung kolom
                        horizontal: isHeader ? "center" : (C === 0 || C >= 4 && C <= 9 || C === 11 || C === 12) ? "center" : "left",
                        wrapText: true // Supaya teks panjang bisa turun otomatis
                    }
                };
            }
            // Style untuk Tanda Tangan & Petunjuk Pengisian
            else if (R >= dataEndIndex) {
                ws[cellRef].s = {
                    font: { sz: 10, bold: R === dataEndIndex + 7 }, // Bold tulisan "Petunjuk Pengisian"
                    alignment: { vertical: "center" }
                };
            }
        }
    }

    // 5. GENERATE & DOWNLOAD EXCEL
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "PEMELIHARAAN");

    const excelBuffer = XLSX.write(wb, { bookType: "xlsx", type: "array" });
    const blob = new Blob([excelBuffer], { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" });
    saveAs(blob, "Rencana_Pemeliharaan_RKBMD.xlsx");
}