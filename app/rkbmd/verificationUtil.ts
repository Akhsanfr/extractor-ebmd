import { PerangkatDaerahJson } from "@/types/perangkatDaerah";
import { ProgramKegiatanJson, Renja, VerifiedUsulan } from "@/types/rkbmd";

/**
 * Mengurutkan list usulan berdasarkan hierarki:
 * penggunaBarang → kuasaPenggunaBarang → program → kegiatan → output
 */
export const sortUsulan = <T extends Renja>(data: T[]): T[] => {
    return [...data].sort((a, b) => {
        const pengguna = a.penggunaBarang.localeCompare(b.penggunaBarang);
        if (pengguna !== 0) return pengguna;
        const kuasa = a.kuasaPenggunaBarang.localeCompare(b.kuasaPenggunaBarang);
        if (kuasa !== 0) return kuasa;
        const prog = a.program.localeCompare(b.program);
        if (prog !== 0) return prog;
        const keg = a.kegiatan.localeCompare(b.kegiatan);
        if (keg !== 0) return keg;
        return a.output.localeCompare(b.output);
    });
};

/**
 * Menandai setiap item apakah keempat field renja-nya valid:
 *  - penggunaBarang       → harus ada di daftar perangkat daerah
 *  - kuasaPenggunaBarang  → harus ada di daftar perangkat daerah (boleh kosong)
 *  - program              → harus ada di daftar program kegiatan
 *  - kegiatan             → harus merupakan kegiatan yang sah di bawah program tersebut
 *
 * Jika salah satu referensi belum selesai di-fetch (array kosong),
 * field terkait dianggap verified sementara untuk menghindari false-positive.
 */
export const buildVerifiedList = <T extends Renja>(
    list: T[],
    pdList: PerangkatDaerahJson[],
    programList: ProgramKegiatanJson[],
): VerifiedUsulan<T>[] => {
    const pdReady = pdList.length > 0;
    const progReady = programList.length > 0;

    // Set untuk lookup O(1)
    const programSet = new Set(programList.map((p) => p.PROGRAM));
    // Map: PROGRAM → Set<KEGIATAN> untuk validasi pasangan
    const kegiatanByProgram = new Map<string, Set<string>>();
    for (const p of programList) {
        if (!kegiatanByProgram.has(p.PROGRAM)) {
            kegiatanByProgram.set(p.PROGRAM, new Set());
        }
        kegiatanByProgram.get(p.PROGRAM)!.add(p.KEGIATAN);
    }

    return list.map((item) => {
        const penggunaBarangVerified = pdReady
            ? pdList.some((pd) => pd.LOKASI === item.penggunaBarang)
            : true;

        const kuasaPenggunaBarangVerified = pdReady
            ? item.kuasaPenggunaBarang.length > 0
                ? pdList.some((pd) => pd.LOKASI === item.kuasaPenggunaBarang)
                : true
            : true;

        const programVerified = progReady
            ? programSet.has(item.program)
            : true;

        // Kegiatan valid hanya jika program juga valid dan kegiatan terdaftar
        // di bawah program tersebut — bukan sekadar ada di daftar manapun.
        const kegiatanVerified = progReady
            ? programVerified
                ? (kegiatanByProgram.get(item.program)?.has(item.kegiatan) ?? false)
                : false // program salah → kegiatan otomatis salah
            : true;

        return {
            ...item,
            penggunaBarangVerified,
            kuasaPenggunaBarangVerified,
            programVerified,
            kegiatanVerified,
            isFullyVerified:
                penggunaBarangVerified &&
                kuasaPenggunaBarangVerified &&
                programVerified &&
                kegiatanVerified,
        };
    });
};

/** Menghitung berapa item yang gagal verifikasi (minimal 1 field false). */
export const countNotVerified = <T extends Renja>(
    list: VerifiedUsulan<T>[]
): number => list.filter((item) => !item.isFullyVerified).length;