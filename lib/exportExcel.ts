import * as XLSX from "xlsx-js-style";
import { saveAs } from "file-saver";
import { FormPemeliharaanData } from "@/app/create/addData";

export async function exportPemeliharaanToExcel(data: FormPemeliharaanData[]) {
    // 1. KELOMPOKKAN DATA 
    // (Gunakan logika grouping yang sama persis seperti sebelumnya)
    const grouped: Record<string, any> = {};
    data.forEach((item) => {
        const { kuasaPenggunaBarang, program, kegiatan, output } = item;
        if (!grouped[kuasaPenggunaBarang]) grouped[kuasaPenggunaBarang] = {};
        if (!grouped[kuasaPenggunaBarang][program]) grouped[kuasaPenggunaBarang][program] = {};
        if (!grouped[kuasaPenggunaBarang][program][kegiatan]) grouped[kuasaPenggunaBarang][program][kegiatan] = {};
        if (!grouped[kuasaPenggunaBarang][program][kegiatan][output]) grouped[kuasaPenggunaBarang][program][kegiatan][output] = [];
        grouped[kuasaPenggunaBarang][program][kegiatan][output].push(item);
    });

    // 2. SUSUN BARIS EXCEL DARI AWAL (Termasuk Header & Judul)
    const rows: any[][] = [];

    // --- BAGIAN JUDUL ---
    rows.push(["RENCANA KEBUTUHAN BARANG MILIK DAERAH"]);
    rows.push(["(RENCANA PEMELIHARAAN)"]);
    rows.push(["PENGGUNA BARANG", ":", "................(2)"]);
    rows.push(["TAHUN ANGGARAN", ":", "2027"]);
    rows.push([]);
    rows.push(["KAB/KOTA", ":", "PASURUAN"]);
    rows.push(["PROVINSI", ":", "JAWA TIMUR"]);
    rows.push([]);

    // --- BAGIAN HEADER TABEL ---
    rows.push([
        "No.", "Kuasa Pengguna Barang/Program/Kegiatan/Output", "Barang Yang Dipelihara", "", "", "",
        "Status Barang", "Kondisi Barang", "", "", "Usulan Kebutuhan Pemeliharaan", "", "", "Keterangan"
    ]);
    rows.push([
        "", "", "Kode Barang", "Nama Barang", "Jumlah", "Satuan", "",
        "B", "RR", "RB", "Nama Pemeliharaan", "Jumlah", "Satuan", ""
    ]);
    rows.push(["1", "2", "3", "4", "5", "6", "7", "8", "9", "10", "11", "12", "13", "14"]);

    // Simpan index baris tempat data dimulai untuk keperluan styling border
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

    // --- BAGIAN TANDA TANGAN DI BAWAH DATA ---
    rows.push([]);
    rows.push([]);
    rows.push(["", "", "", "", "", "", "", "", "", "", ".................., ....................................(21)"]);
    rows.push(["", "", "", "", "", "", "", "", "", "", "PENGGUNA BARANG………(22)"]);
    rows.push([]);
    rows.push([]);
    rows.push([]);
    rows.push(["", "", "", "", "", "", "", "", "", "", "..........................................................(23)"]);
    rows.push(["", "", "", "", "", "", "", "", "", "", "NIP ………………………….………… (23)"]);

    // 3. BUAT WORKSHEET & WORKBOOK
    const ws = XLSX.utils.aoa_to_sheet(rows);

    // Merge Cells untuk Judul & Header Tabel
    ws["!merges"] = [
        { s: { r: 8, c: 0 }, e: { r: 9, c: 0 } },   // No
        { s: { r: 8, c: 1 }, e: { r: 9, c: 1 } },   // Kuasa Pengguna
        { s: { r: 8, c: 2 }, e: { r: 8, c: 5 } },   // Barang Yang Dipelihara
        { s: { r: 8, c: 6 }, e: { r: 9, c: 6 } },   // Status Barang
        { s: { r: 8, c: 7 }, e: { r: 8, c: 9 } },   // Kondisi
        { s: { r: 8, c: 10 }, e: { r: 8, c: 12 } }, // Usulan
        { s: { r: 8, c: 13 }, e: { r: 9, c: 13 } }  // Keterangan
    ];

    // 4. STYLING TABEL (Border & Font)
    // Style dasar untuk border garis tipis
    const borderStyle = {
        top: { style: "thin" }, bottom: { style: "thin" },
        left: { style: "thin" }, right: { style: "thin" }
    };

    // Aplikasikan styling hanya ke area tabel (Header sampai akhir data)
    for (let R = 8; R < dataEndIndex; ++R) {
        for (let C = 0; C < 14; ++C) {
            const cellRef = XLSX.utils.encode_cell({ r: R, c: C });
            if (!ws[cellRef]) ws[cellRef] = { t: "s", v: "" }; // Pastikan sel kosong tetap ter-render border-nya

            ws[cellRef].s = {
                border: borderStyle,
                font: { bold: R < 11 }, // Bold untuk header (Baris 9, 10, 11)
                alignment: {
                    vertical: "center",
                    horizontal: R < 11 ? "center" : "left" // Header rata tengah, data rata kiri
                }
            };
        }
    }

    // 5. DOWNLOAD EXCEL
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "PEMELIHARAAN");

    // Tulis ke buffer dan download menggunakan file-saver
    const excelBuffer = XLSX.write(wb, { bookType: "xlsx", type: "array" });
    const blob = new Blob([excelBuffer], { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" });
    saveAs(blob, "Rencana_Pemeliharaan_RKBMD.xlsx");
}