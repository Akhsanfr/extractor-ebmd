import { Barang } from "./bmd";

type Renja = {
    penggunaBarang: string;
    kuasaPenggunaBarang: string;
    program: string;
    kegiatan: string;
    output: string;
}
export type FormPengadaan = Renja & {
    // BMD yang dibutuhkan
    usulan: Barang | null;
    // BMD yang masih bisa dioptimalkan
    bmdBisaDioptimalkan: Barang | null;
    // BMD yang dibutuhkan - BMD yang bisa dioptimalkan
    kebutuhanRiil: {
        jumlah: number;
        satuan: string;
    } | null;
}
export type ListPengadaan = Renja & {
    // BMD yang dibutuhkan
    usulan: Barang;
    // BMD yang masih bisa dioptimalkan
    bmdBisaDioptimalkan: Barang;
    // BMD yang dibutuhkan - BMD yang bisa dioptimalkan
    kebutuhanRiil: {
        jumlah: number;
        satuan: string;
    };
}

export type FormPemeliharan = Renja & {
    bmd: Barang | null;
    usulanPemeliharaan: {
        namaPemeliharaan: string;
        jumlah: number;
        satuan: string;
    } | null
    keterangan: string;
}
export type ListPemeliharaan = Renja & {
    bmd: Barang;
    usulanPemeliharaan: {
        namaPemeliharaan: string;
        jumlah: number;
        satuan: string;
    }
    keterangan: string;
}