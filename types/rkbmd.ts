import { Barang } from "./bmd";

export type Renja = {
    penggunaBarang: string;
    kuasaPenggunaBarang: string;
    program: string;
    kegiatan: string;
    output: string;
}
export type FormPengadaan = Renja & {
    usulan: Barang | null;
    bmdBisaDioptimalkan: Barang | null;
    kebutuhanRiil: {
        jumlah: number;
        satuan: string;
    } | null;
}
export type ListPengadaan = Renja & {
    usulan: Barang;
    bmdBisaDioptimalkan: Barang;
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

export type VerifiedUsulan<T extends Renja> = T & {
    penggunaBarangVerified: boolean;
    kuasaPenggunaBarangVerified: boolean;
    programVerified: boolean;
    kegiatanVerified: boolean;
    /** true hanya jika semua 4 field di atas true */
    isFullyVerified: boolean;
};

export type ProgramKegiatanJson = {
    PROGRAM: string;
    KEGIATAN: string;
};