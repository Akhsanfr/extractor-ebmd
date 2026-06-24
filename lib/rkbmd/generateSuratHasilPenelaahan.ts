import PizZip from "pizzip";
import Docxtemplater from "docxtemplater";
import { RkbmdBaContract } from "@/action/rkbmdBa/rkbmd-ba-contract";

export async function generateSuratHasilPenelaahan(data: RkbmdBaContract.SelectDTO): Promise<void> {
    // 1. Fetch template dari /public
    const response = await fetch("/rkbmd/template-surat-hasil-penelaahan.docx");
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
        perangkatDaerah: data.perangkatDaerah
            ?.toLowerCase()
            .split(" ")
            .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
            .join(" "),
        pengantarNomor: data.pengantarNomor,
        pengantarTanggal: data.pengantarTanggal?.toLocaleDateString("id-ID", {
            day: "numeric",
            month: "long",
            year: "numeric",
        })
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
    anchor.download = `SURAT HASIL PENELAAHAN ${data.perangkatDaerah}.docx`;
    document.body.appendChild(anchor);
    anchor.click();
    document.body.removeChild(anchor);
    URL.revokeObjectURL(url);
}