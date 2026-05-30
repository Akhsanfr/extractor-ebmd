import { PerangkatDaerahJson } from "@/types/perangkatDaerah";
import { Renja, VerifiedUsulan } from "@/types/rkbmd";

export const sortUsulan = <T extends Renja>(data: T[]): T[] => {
    return [...data].sort((a, b) => {
        const pengguna = a.penggunaBarang.localeCompare(b.penggunaBarang); // fix: harusnya b.penggunaBarang
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


export const buildVerifiedList = <T extends Renja>(
    list: T[],
    pdList: PerangkatDaerahJson[]
): VerifiedUsulan<T>[] => list.map((item) => ({
    ...item,
    penggunaBarangVerified: pdList.some((pd) => pd.LOKASI === item.penggunaBarang),
    kuasaPenggunaBarangVerified: item.kuasaPenggunaBarang.length > 0
        ? pdList.some((pd) => pd.LOKASI === item.kuasaPenggunaBarang)
        : true,
}));