// lib/exportExcel.ts
import * as XLSX from "xlsx";
import { FormPemeliharaanData } from "@/app/create/addData"; // Sesuaikan path interface Anda

export function exportPemeliharaanToExcel(data: FormPemeliharaanData[]) {
    // 1. KELOMPOKKAN DATA (Grouping: Kuasa -> Program -> Kegiatan -> Output)
    const grouped: Record<string, any> = {};

    data.forEach((item) => {
        const { kuasaPenggunaBarang, program, kegiatan, output } = item;

        if (!grouped[kuasaPenggunaBarang]) grouped[kuasaPenggunaBarang] = {};
        if (!grouped[kuasaPenggunaBarang][program]) grouped[kuasaPenggunaBarang][program] = {};
        if (!grouped[kuasaPenggunaBarang][program][kegiatan]) grouped[kuasaPenggunaBarang][program][kegiatan] = {};
        if (!grouped[kuasaPenggunaBarang][program][kegiatan][output]) grouped[kuasaPenggunaBarang][program][kegiatan][output] = [];

        grouped[kuasaPenggunaBarang][program][kegiatan][output].push(item);
    });

    // 2. SUSUN BARIS EXCEL (Berdasarkan template Rencana Pemeliharaan)
    const rows: any[][] = [];

    // Header Laporan
    rows.push(["RENCANA KEBUTUHAN BARANG MILIK DAERAH"]);
    rows.push(["(RENCANA PEMELIHARAAN)"]);
    rows.push(["PENGGUNA BARANG", ":", "................(2)"]);
    rows.push(["TAHUN ANGGARAN", ":", "2027"]);
    rows.push([]);
    rows.push(["KAB/KOTA", ":", "PASURUAN"]);
    rows.push(["PROVINSI", ":", "JAWA TIMUR"]);
    rows.push([]);

    // Header Tabel
    rows.push([
        "No.",
        "Kuasa Pengguna Barang/Program/Kegiatan/Output",
        "Barang Yang Dipelihara", "", "", "",
        "Status Barang",
        "Kondisi Barang", "", "",
        "Usulan Kebutuhan Pemeliharaan", "", "",
        "Keterangan"
    ]);
    rows.push([
        "", "",
        "Kode Barang", "Nama Barang", "Jumlah", "Satuan",
        "",
        "B", "RR", "RB",
        "Nama Pemeliharaan", "Jumlah", "Satuan", ""
    ]);
    rows.push(["1", "2", "3", "4", "5", "6", "7", "8", "9", "10", "11", "12", "13", "14"]);

    // Helper penomoran otomatis
    const getAlpha = (i: number) => String.fromCharCode(65 + i); // 0 -> A, 1 -> B
    const getLowerAlpha = (i: number) => String.fromCharCode(97 + i); // 0 -> a, 1 -> b

    // 3. RENDER DATA YANG SUDAH DIKELOMPOKKAN
    let kuasaIndex = 1;
    for (const [kuasa, programs] of Object.entries(grouped)) {
        // Baris Kuasa Pengguna Barang
        rows.push(["", `${kuasaIndex}. ${kuasa}`]);

        let progIndex = 0;
        for (const [program, kegiatans] of Object.entries(programs as Record<string, any>)) {
            // Baris Program
            rows.push(["", `     ${getAlpha(progIndex)}. ${program}`]);

            let kegIndex = 1;
            for (const [kegiatan, outputs] of Object.entries(kegiatans as Record<string, any>)) {
                // Baris Kegiatan
                rows.push(["", `          ${kegIndex}). ${kegiatan}`]);

                let outIndex = 0;
                for (const [output, items] of Object.entries(outputs as Record<string, any>)) {
                    // Baris Output
                    rows.push(["", `               ${getLowerAlpha(outIndex)}. ${output}`]);

                    // Baris Detail Barang Milik Daerah (BMD)
                    for (const item of items as FormPemeliharaanData[]) {
                        rows.push([
                            "", // No
                            "", // Kosong agar inden rapi
                            item.kodeBarang,
                            item.namaBarang,
                            item.jumlahTersedia, // Jumlah tersedia barang asli
                            item.satuan,
                            "Milik Sendiri", // Status barang default
                            "v", // Kondisi Baik (B) default
                            "",  // RR
                            "",  // RB
                            item.namaPemeliharaan,
                            item.jumlah, // Jumlah usulan pemeliharaan
                            item.satuan, // Satuan pemeliharaan
                            "" // Keterangan
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

    // 4. BUAT WORKBOOK & DOWNLOAD
    const ws = XLSX.utils.aoa_to_sheet(rows);

    // Styling Merge Cells pada kolom header (Merapikan tampilan seperti di template)
    ws["!merges"] = [
        { s: { r: 8, c: 0 }, e: { r: 9, c: 0 } },   // Merge: No.
        { s: { r: 8, c: 1 }, e: { r: 9, c: 1 } },   // Merge: Kuasa Pengguna...
        { s: { r: 8, c: 2 }, e: { r: 8, c: 5 } },   // Merge: Barang Yang Dipelihara
        { s: { r: 8, c: 6 }, e: { r: 9, c: 6 } },   // Merge: Status Barang
        { s: { r: 8, c: 7 }, e: { r: 8, c: 9 } },   // Merge: Kondisi Barang
        { s: { r: 8, c: 10 }, e: { r: 8, c: 12 } }, // Merge: Usulan Kebutuhan
        { s: { r: 8, c: 13 }, e: { r: 9, c: 13 } }  // Merge: Keterangan
    ];

    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "RKBMD_Pemeliharaan");

    // Trigger Download
    XLSX.writeFile(wb, "Rencana_Pemeliharaan_RKBMD.xlsx");
}