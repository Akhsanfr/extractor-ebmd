import { PerangkatDaerahJson } from "@/types/perangkatDaerah";
import { Renja, VerifiedUsulan } from "@/types/rkbmd";

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
 * Menandai setiap item apakah penggunaBarang dan kuasaPenggunaBarang-nya
 * terdaftar dalam daftar perangkat daerah resmi.
 *
 * Catatan: jika pdList kosong (JSON belum selesai di-fetch),
 * semua item dianggap verified agar tidak muncul false-positive.
 */
export const buildVerifiedList = <T extends Renja>(
    list: T[],
    pdList: PerangkatDaerahJson[]
): VerifiedUsulan<T>[] => {
    // Belum ada data referensi → anggap semua valid sementara
    if (pdList.length === 0) {
        return list.map((item) => ({
            ...item,
            penggunaBarangVerified: true,
            kuasaPenggunaBarangVerified: true,
        }));
    }

    return list.map((item) => ({
        ...item,
        penggunaBarangVerified: pdList.some((pd) => pd.LOKASI === item.penggunaBarang),
        kuasaPenggunaBarangVerified:
            item.kuasaPenggunaBarang.length > 0
                ? pdList.some((pd) => pd.LOKASI === item.kuasaPenggunaBarang)
                : true,
    }));
};

/** Menghitung berapa item yang gagal verifikasi (salah satu field false). */
export const countNotVerified = <T extends Renja>(
    list: VerifiedUsulan<T>[]
): number =>
    list.filter(
        (item) => !item.penggunaBarangVerified || !item.kuasaPenggunaBarangVerified
    ).length;