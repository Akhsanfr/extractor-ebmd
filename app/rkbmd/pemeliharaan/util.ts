import { AsetType } from "@/app/page";
import { loadStorage, PEMELIHARAAN_STORAGE_KEY, PEMELIHARAAN_STORAGE_KEY_V1, PERANGKAT_DAERAH_KEY, saveStorage } from "@/lib/bmd-storage";
import { PerangkatDaerah } from "@/types/perangkatDaerah";
import { ListPemeliharaan } from "@/types/rkbmd";

export type ItemPemeliharaanV1 = {
    kuasaPenggunaBarang: string;
    program: string;
    kegiatan: string;
    output: string;
    kodeBarang: string;
    namaBarang: string;
    jumlahTersedia: number;
    satuan: string;
    asetType: string;
    namaPemeliharaan: string;
    jumlah: number;
};

export const convertPemeliharaanV1toV2 = (): ListPemeliharaan[] => {
    try {
        // 1. Load data pemeliharaan V1
        const data = loadStorage<ItemPemeliharaanV1[]>(PEMELIHARAAN_STORAGE_KEY_V1);

        // 2. Load data profil perangkat daerah untuk mengambil Pengguna/Kuasa Pengguna Barang
        const profile = loadStorage<PerangkatDaerah>(PERANGKAT_DAERAH_KEY);

        if (data && data.length > 0) {
            const res = data.map((d: ItemPemeliharaanV1): ListPemeliharaan => {
                return {
                    // Renja mapping
                    penggunaBarang: profile?.penggunaBarang || "",
                    kuasaPenggunaBarang: profile?.kuasaPenggunaBarang || d.kuasaPenggunaBarang || "",
                    program: d.program || "",
                    kegiatan: d.kegiatan || "",
                    output: d.output || "",

                    // BMD mapping
                    bmd: {
                        kodeBarang: d.kodeBarang || "",
                        namaBarang: d.namaBarang || "",
                        jumlah: Number(d.jumlahTersedia) || 0,
                        satuan: d.satuan || "",
                        asetType: (d.asetType as AsetType) || "peralatan_mesin",
                    },

                    // Usulan Pemeliharaan mapping
                    usulanPemeliharaan: {
                        namaPemeliharaan: d.namaPemeliharaan || "",
                        jumlah: Number(d.jumlah) || 0,
                        satuan: d.satuan || "",
                    },

                    keterangan: "", // Default empty string since V1 didn't have keterangan
                };
            });
            saveStorage(PEMELIHARAAN_STORAGE_KEY, res);
            return res;
        }

        return [];
    } catch (error: any) {
        console.error("Error saat convert pemeliharaan V1 ke V2:", error.message);
        return [];
    }
};
