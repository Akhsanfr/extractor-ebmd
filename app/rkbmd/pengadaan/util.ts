// Type untuk keseluruhan array
// export type PayloadRencanaKebutuhan = ItemRencanaKebutuhan[];
import { AsetType } from "@/app/page";
import { loadStorage, PENGADAAN_STORAGE_KEY, PERANGKAT_DAERAH_KEY, saveStorage } from "@/lib/bmd-storage";
import { PerangkatDaerah } from "@/types/perangkatDaerah";
import { ListPengadaan } from "@/types/rkbmd";

const PENGADAAN_STORAGE_KEY_V1 = "bmd_list_pengadaan";

export type UsulanBarang = {
    kodeBarang: string;
    namaBarang: string;
    jumlah: number;
    satuan: string;
    asetType: string;
};

export type KebutuhanRiil = {
    jumlah: number;
    satuan: string;
};

export type ItemRencanaKebutuhan = {
    kuasaPenggunaBarang: string;
    program: string;
    kegiatan: string;
    output: string;
    usulan: UsulanBarang;
    bmdBisaDioptimalkan: unknown | null;
    kebutuhanRiil: KebutuhanRiil;
};


export const convertPengadaanV1toV2 = (): ListPengadaan[] => {
    try {
        // 1. Load data pengadaan V1
        const data = loadStorage<ItemRencanaKebutuhan[]>(PENGADAAN_STORAGE_KEY_V1);
        console.log("data old")
        console.log(data)

        // 2. Load data profil perangkat daerah untuk mengambil Pengguna/Kuasa Pengguna Barang
        const profile = loadStorage<PerangkatDaerah>(PERANGKAT_DAERAH_KEY);

        if (data && data.length > 0) {
            console.log("proses peralihan")
            const res = data.map((d: ItemRencanaKebutuhan): ListPengadaan => {
                return {
                    // Renja mapping
                    // Ambil penggunaBarang dari profil. Jika null, fallback ke string kosong.
                    penggunaBarang: profile?.penggunaBarang || "",

                    // Prioritaskan kuasaPenggunaBarang dari profil, jika kosong ambil dari data V1 lama.
                    kuasaPenggunaBarang: profile?.kuasaPenggunaBarang || "",

                    program: d.program || "",
                    kegiatan: d.kegiatan || "",
                    output: d.output || "",

                    // Usulan mapping
                    usulan: {
                        kodeBarang: d.usulan?.kodeBarang || "",
                        namaBarang: d.usulan?.namaBarang || "",
                        jumlah: Number(d.usulan?.jumlah) || 0,
                        satuan: d.usulan?.satuan || "",
                        asetType: (d.usulan?.asetType as AsetType) || "peralatan_mesin",
                    },

                    // bmdBisaDioptimalkan mapping (Strict non-null di V2)
                    bmdBisaDioptimalkan: d.bmdBisaDioptimalkan ? {
                        kodeBarang: (d.bmdBisaDioptimalkan as any).kodeBarang || "",
                        namaBarang: (d.bmdBisaDioptimalkan as any).namaBarang || "",
                        jumlah: Number((d.bmdBisaDioptimalkan as any).jumlah) || 0,
                        satuan: (d.bmdBisaDioptimalkan as any).satuan || "",
                        asetType: ((d.bmdBisaDioptimalkan as any).asetType as AsetType) || "peralatan_mesin",
                    } : {
                        kodeBarang: "",
                        namaBarang: "",
                        jumlah: 0,
                        satuan: "",
                        asetType: "peralatan_mesin",
                    },

                    // Kebutuhan Riil mapping
                    kebutuhanRiil: {
                        jumlah: Number(d.kebutuhanRiil?.jumlah) || 0,
                        satuan: d.kebutuhanRiil?.satuan || "",
                    }
                };
            });
            saveStorage(PENGADAAN_STORAGE_KEY, res)
            return res
        }

        return [];
    } catch (error: any) {
        console.error("Error saat convert pengadaan V1 ke V2:", error.message);
        return [];
    }
};