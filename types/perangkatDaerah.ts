export enum JenisPerangkatDaerah {
    penggunaBarang = "Pengguna Barang",
    kuasaPenggunaBarang = "Kuasa Pengguna Barang"
}
export type PerangkatDaerah = {
    jenis: JenisPerangkatDaerah;
    penggunaBarang: "";
    kuasaPenggunaBarang: "";
    namaPimpinan: string;
    nipPimpinan: string;
}
export type PerangkatDaerahJson = {
    ID: string;
    LOKASI: string;
    STATUS: JenisPerangkatDaerah;
    "PARENT ID": string;
};