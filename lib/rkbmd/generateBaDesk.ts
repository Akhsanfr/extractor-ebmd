// lib/generateUsulanDoc.ts

import PizZip from "pizzip";
import Docxtemplater from "docxtemplater";
import { RkbmdBaContract } from "@/action/rkbmdBa/rkbmd-ba-contract";
import { Perekon } from "@/app/admin/rkbmd-ba/page";

const now = new Date();

function terbilang(n: number): string {
    const angka = [
        "",
        "satu",
        "dua",
        "tiga",
        "empat",
        "lima",
        "enam",
        "tujuh",
        "delapan",
        "sembilan",
        "sepuluh",
        "sebelas",
    ];

    if (n < 12) return angka[n];
    if (n < 20) return `${terbilang(n - 10)} belas`;
    if (n < 100) {
        const puluh = Math.floor(n / 10);
        const sisa = n % 10;
        return `${terbilang(puluh)} puluh${sisa ? ` ${terbilang(sisa)}` : ""}`;
    }

    throw new Error("Hanya mendukung angka sampai 99");
}

const hari = new Intl.DateTimeFormat("id-ID", {
    weekday: "long",
}).format(now);

const tanggal = terbilang(now.getDate())

const bulan = new Intl.DateTimeFormat("id-ID", {
    month: "long",
}).format(now);

export async function generateBaDesk(perekon: Perekon, data: RkbmdBaContract.SelectDTO): Promise<void> {
    console.log("perekon", perekon)
    // 1. Fetch template dari /public
    const response = await fetch("/rkbmd/template-ba-desk.docx");
    if (!response.ok) {
        throw new Error(`Gagal memuat template: ${response.statusText}`);
    }

    const arrayBuffer = await response.arrayBuffer();

    // 2. Load ke PizZip + Docxtemplater
    const zip = new PizZip(arrayBuffer);
    const doc = new Docxtemplater(zip, {
        paragraphLoop: true,
        linebreaks: true,
    });

    // 3. Set data (placeholder di template pakai syntax {penggunaBarang} dll)
    doc.setData({
        hari,
        tanggal,
        bulan,
        jabatanPeserta: data.jabatanPeserta,
        namaPeserta: data.namaPeserta,
        nipPeserta: data.nipPeserta,
        perangkatDaerah: data.perangkatDaerah,
        namaPerekon: perekon.nama,
        nipPerekon: perekon.nip,
        hasilSuratPengantar: data.pengantar ? "sesuai dengan ketentuan" : "tidak sesuai dengan ketentuan",
        hasilUsulanRKBMDPengadaan: data.pengadaan ? "sesuai dengan ketentuan" : "tidak sesuai dengan ketentuan",
        hasilUsulanRKBMDPemeliharaan: data.pemeliharaan ? "sesuai dengan ketentuan" : "tidak sesuai dengan ketentuan",
        tanggalPerbaikan: "12 Juni 2026"
    });

    // 4. Render (throw jika ada placeholder yang tidak ditemukan)
    try {
        doc.render();
    } catch (error) {
        const e = error as { properties?: { errors?: unknown[] } };
        if (e?.properties?.errors) {
            console.error("Docxtemplater errors:", e.properties.errors);
        }
        throw error;
    }

    // 5. Generate blob dan trigger download
    const blob = doc.getZip().generate({
        type: "blob",
        mimeType:
            "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
        compression: "DEFLATE",
    });

    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = `BA DESK RKBMD ${data.perangkatDaerah}.docx`;
    document.body.appendChild(anchor);
    anchor.click();
    document.body.removeChild(anchor);
    URL.revokeObjectURL(url);
}