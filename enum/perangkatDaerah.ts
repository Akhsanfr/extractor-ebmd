// export const PerangkatDaerahJabatan = {
//     PENGGUNA: "pengguna barang",
//     KUASA_PENGGUNA: "kuasa pengguna barang",
//     SUB_KUASA_PENGGUNA: "sub kuasa pengguna barang",
// } as const;

// export type PerangkatDaerahJabatan =
//     typeof PerangkatDaerahJabatan[keyof typeof PerangkatDaerahJabatan];

export const PerangkatDaerah = [
"Badan Keuangan dan Aset Daerah",
"Badan Pendapatan Daerah",
"Badan Kepegawaian dan Pengembangan Sumber Daya Manusia",
"Badan Kesatuan Bangsa dan Politik",
"Badan Perencanaan Pembangunan, Riset dan Inovasi Daerah",
"Dinas Cipta Karya dan Tata Ruang",
"Dinas Kebudayaan dan Pariwisata",
"Dinas Kependudukan dan Pencatatan Sipil",
"Dinas Kesehatan Daerah, Pengendalian Penduduk dan Keluarga Berencana",
"Dinas Ketahanan Pangan, Pertanian dan Perikanan",
"Dinas Ketenagakerjaan",
"Dinas Komunikasi dan Informatika",
"Dinas Koperasi, Usaha Kecil, Menengah, Perindustrian dan Perdagangan",
"Dinas Lingkungan Hidup",
"Dinas Pemberdayaan Masyarakat dan Desa",
"Dinas Pemuda dan Olahraga",
"Dinas Penanaman Modal dan Pelayanan Terpadu Satu Pintu",
"Dinas Pendidikan",
"Dinas Perhubungan",
"Dinas Perpustakaan dan Kearsipan",
"Dinas Perumahan dan Kawasan Permukiman",
"Dinas Sosial, Pemberdayaan Perempuan dan Perlindungan Anak",
"Dinas Sumber Daya Air, Bina Marga dan Bina Konstruksi",
"Inspektorat Daerah",
"Satuan Polisi Pamong Praja",
"Sekretariat Daerah",
"Sekretariat DPRD",
"BPBD",
"RSUD Bangil",
"RSUD Grati",
"Kecamatan Bangil",
"Kecamatan Beji",
"Kecamatan Gempol",
"Kecamatan Gondang Wetan",
"Kecamatan Grati",
"Kecamatan Kejayan",
"Kecamatan Kraton",
"Kecamatan Lekok",
"Kecamatan Lumbang",
"Kecamatan Nguling",
"Kecamatan Pandaan",
"Kecamatan Pasrepan",
"Kecamatan Pohjentrek",
"Kecamatan Prigen",
"Kecamatan Purwodadi",
"Kecamatan Purwosari",
"Kecamatan Puspo",
"Kecamatan Rejoso",
"Kecamatan Rembang",
"Kecamatan Sukorejo",
"Kecamatan Tosari",
"Kecamatan Tutur",
"Kecamatan Winongan",
"Kecamatan Wonorejo",
"Pengelola Barang Milik Daerah"
] as const;

export type PerangkatDaerah = (typeof PerangkatDaerah)[number];

export const PerangkatDaerahJabatan: Record<PerangkatDaerah, string> = {
    "Badan Keuangan dan Aset Daerah":
        "Kepala Badan Keuangan dan Aset Daerah",

    "Badan Pendapatan Daerah":
        "Kepala Badan Pendapatan Daerah",

    "Badan Kepegawaian dan Pengembangan Sumber Daya Manusia":
        "Kepala Badan Kepegawaian dan Pengembangan Sumber Daya Manusia",

    "Badan Kesatuan Bangsa dan Politik":
        "Kepala Badan Kesatuan Bangsa dan Politik",

    "Badan Perencanaan Pembangunan, Riset dan Inovasi Daerah":
        "Kepala Badan Perencanaan Pembangunan, Riset dan Inovasi Daerah",

    "Dinas Cipta Karya dan Tata Ruang":
        "Kepala Dinas Cipta Karya dan Tata Ruang",

    "Dinas Kebudayaan dan Pariwisata":
        "Kepala Dinas Kebudayaan dan Pariwisata",

    "Dinas Kependudukan dan Pencatatan Sipil":
        "Kepala Dinas Kependudukan dan Pencatatan Sipil",

    "Dinas Kesehatan Daerah, Pengendalian Penduduk dan Keluarga Berencana":
        "Kepala Dinas Kesehatan Daerah, Pengendalian Penduduk dan Keluarga Berencana",

    "Dinas Ketahanan Pangan, Pertanian dan Perikanan":
        "Kepala Dinas Ketahanan Pangan, Pertanian dan Perikanan",

    "Dinas Ketenagakerjaan":
        "Kepala Dinas Ketenagakerjaan",

    "Dinas Komunikasi dan Informatika":
        "Kepala Dinas Komunikasi dan Informatika",

    "Dinas Koperasi, Usaha Kecil, Menengah, Perindustrian dan Perdagangan":
        "Kepala Dinas Koperasi, Usaha Kecil, Menengah, Perindustrian dan Perdagangan",

    "Dinas Lingkungan Hidup":
        "Kepala Dinas Lingkungan Hidup",

    "Dinas Pemberdayaan Masyarakat dan Desa":
        "Kepala Dinas Pemberdayaan Masyarakat dan Desa",

    "Dinas Pemuda dan Olahraga":
        "Kepala Dinas Pemuda dan Olahraga",

    "Dinas Penanaman Modal dan Pelayanan Terpadu Satu Pintu":
        "Kepala Dinas Penanaman Modal dan Pelayanan Terpadu Satu Pintu",

    "Dinas Pendidikan":
        "Kepala Dinas Pendidikan",

    "Dinas Perhubungan":
        "Kepala Dinas Perhubungan",

    "Dinas Perpustakaan dan Kearsipan":
        "Kepala Dinas Perpustakaan dan Kearsipan",

    "Dinas Perumahan dan Kawasan Permukiman":
        "Kepala Dinas Perumahan dan Kawasan Permukiman",

    "Dinas Sosial, Pemberdayaan Perempuan dan Perlindungan Anak":
        "Kepala Dinas Sosial, Pemberdayaan Perempuan dan Perlindungan Anak",

    "Dinas Sumber Daya Air, Bina Marga dan Bina Konstruksi":
        "Kepala Dinas Sumber Daya Air, Bina Marga dan Bina Konstruksi",

    "Inspektorat Daerah":
        "Inspektur Daerah",

    "Satuan Polisi Pamong Praja":
        "Kepala Satuan Polisi Pamong Praja",

    "Sekretariat Daerah":
        "Sekretaris Daerah",

    "Sekretariat DPRD":
        "Sekretaris DPRD",

    "BPBD":
        "Kepala Pelaksana BPBD",

    "RSUD Bangil":
        "Direktur RSUD Bangil",

    "RSUD Grati":
        "Direktur RSUD Grati",

    "Kecamatan Bangil":
        "Camat Bangil",

    "Kecamatan Beji":
        "Camat Beji",

    "Kecamatan Gempol":
        "Camat Gempol",

    "Kecamatan Gondang Wetan":
        "Camat Gondang Wetan",

    "Kecamatan Grati":
        "Camat Grati",

    "Kecamatan Kejayan":
        "Camat Kejayan",

    "Kecamatan Kraton":
        "Camat Kraton",

    "Kecamatan Lekok":
        "Camat Lekok",

    "Kecamatan Lumbang":
        "Camat Lumbang",

    "Kecamatan Nguling":
        "Camat Nguling",

    "Kecamatan Pandaan":
        "Camat Pandaan",

    "Kecamatan Pasrepan":
        "Camat Pasrepan",

    "Kecamatan Pohjentrek":
        "Camat Pohjentrek",

    "Kecamatan Prigen":
        "Camat Prigen",

    "Kecamatan Purwodadi":
        "Camat Purwodadi",

    "Kecamatan Purwosari":
        "Camat Purwosari",

    "Kecamatan Puspo":
        "Camat Puspo",

    "Kecamatan Rejoso":
        "Camat Rejoso",

    "Kecamatan Rembang":
        "Camat Rembang",

    "Kecamatan Sukorejo":
        "Camat Sukorejo",

    "Kecamatan Tosari":
        "Camat Tosari",

    "Kecamatan Tutur":
        "Camat Tutur",

    "Kecamatan Winongan":
        "Camat Winongan",

    "Kecamatan Wonorejo":
        "Camat Wonorejo",

    "Pengelola Barang Milik Daerah":
        "Sekretaris Daerah",
};
