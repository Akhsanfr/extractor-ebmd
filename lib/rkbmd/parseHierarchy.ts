import {
    fromLowerAlpha,
    fromUpperAlpha,
    fromRoman,
} from "../formater/convertAlfaNumeric";

interface HierarchyState {
    curPengguna: string;
    curKuasa: string;
    curProgram: string;
    curKegiatan: string;
    curOutput: string;
}

export function parseHierarchy(colGroup: string, s: HierarchyState): void {
    // 1. Cek apakah ada indentasi (spasi di awal) sebelum di-trim
    // Pengguna Barang (Roman) di ujung kiri (tidak ada spasi)
    // Program, dkk memiliki spasi di awal.
    const isIndented = /^\s/.test(colGroup);

    const trimmed = colGroup.trim();

    // ====================================================
    // Pengguna Barang (Roman)
    // I. ...
    // II. ...
    // ====================================================
    const romanMatch = trimmed.match(/^([IVXLCDM]+)\.\s+(.*)$/);

    // 2. Tambahkan syarat !isIndented
    // Jika dia Roman TAPI memiliki indentasi, berarti itu Program (C., V., X., I.)
    if (romanMatch && !isIndented) {
        try {
            const index = fromRoman(romanMatch[1].toUpperCase());

            if (index > 0) {
                s.curPengguna = romanMatch[2].trim();

                s.curKuasa = "";
                s.curProgram = "";
                s.curKegiatan = "";
                s.curOutput = "";

                return;
            }
        } catch {
            // lanjut ke parser berikutnya
        }
    }

    // ====================================================
    // Output (huruf kecil)
    // a. ...
    // z. ...
    // aa. ...
    // ab. ...
    // ====================================================
    const outputMatch = trimmed.match(/^([a-z]+)\.\s+(.*)$/);

    if (outputMatch) {
        try {
            fromLowerAlpha(outputMatch[1]);

            s.curOutput = outputMatch[2].trim();

            return;
        } catch {
            // lanjut
        }
    }

    // ====================================================
    // Program (huruf besar)
    // A. ...
    // Z. ...
    // AA. ...
    // AB. ...
    // ====================================================
    const programMatch = trimmed.match(/^([A-Z]+)\.\s+(.*)$/);

    if (programMatch) {
        try {
            fromUpperAlpha(programMatch[1]);

            s.curProgram = programMatch[2].trim();

            s.curKegiatan = "";
            s.curOutput = "";

            return;
        } catch {
            // lanjut
        }
    }

    // ====================================================
    // Kegiatan
    // 1) ...
    // 1). ...
    // 12). ...
    // ====================================================
    const kegiatanMatch = trimmed.match(/^\d+\)\.?\s+(.*)$/);

    if (kegiatanMatch) {
        s.curKegiatan = kegiatanMatch[1].trim();

        s.curOutput = "";

        return;
    }

    // ====================================================
    // Kuasa Pengguna Barang
    // 1. ...
    // 2. ...
    // 10. ...
    // ====================================================
    const kuasaMatch = trimmed.match(/^\d+\.\s+(.*)$/);

    if (kuasaMatch) {
        s.curKuasa = kuasaMatch[1].trim();

        s.curProgram = "";
        s.curKegiatan = "";
        s.curOutput = "";

        return;
    }
}