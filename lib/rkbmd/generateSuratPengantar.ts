// lib/generateUsulanDoc.ts

import PizZip from "pizzip";
import Docxtemplater from "docxtemplater";

interface UsulanDocParams {
  penggunaBarang: string;
  namaPimpinan: string;
  nipPimpinan: string;
}

export async function generateSuratPengantar({
  penggunaBarang,
  namaPimpinan,
  nipPimpinan,
}: UsulanDocParams): Promise<void> {
  // 1. Fetch template dari /public
  const response = await fetch("/rkbmd/template-surat-pengantar.docx");
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
    penggunaBarang,
    namaPimpinan,
    nipPimpinan,
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
  anchor.download = `Usulan RKBMD ${penggunaBarang}.docx`;
  document.body.appendChild(anchor);
  anchor.click();
  document.body.removeChild(anchor);
  URL.revokeObjectURL(url);
}