import { RekonContract } from "@/action/rekon/contract";
import { generateDocument } from "..";
import { daftarBulan } from "@/lib/date";

type RekonRow = RekonContract.SelectWithPerangkatDaerahDTO;

const angkaFormatter = new Intl.NumberFormat("id-ID", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
});

// 1000000 -> "1.000.000,00"
const formatAngka = (n: number) => angkaFormatter.format(n);

// 100 -> "100,00%"
const formatPersen = (n: number) => `${angkaFormatter.format(n)}%`;

const hitungPersentase = (inputBMD: number, realisasi: number) =>
    realisasi > 0 ? (inputBMD / realisasi) * 100 : 0;

const formatKategori = (rows: RekonRow[]) => {
    const raw = rows
        .map((r) => {
            const realisasi = Number(r.realisasiAnggaran) || 0;
            const input = Number(r.inputBMD) || 0;

            return {
                ...r,
                realisasiAnggaran: realisasi,
                inputBMD: input,
                selisih: realisasi - input,
                persentase: hitungPersentase(input, realisasi),
            };
        })
        // 1. persentase tertinggi, 2. realisasi anggaran tertinggi
        .sort(
            (a, b) =>
                b.persentase - a.persentase ||
                b.realisasiAnggaran - a.realisasiAnggaran
        );

    const totalRealisasi = raw.reduce((s, r) => s + r.realisasiAnggaran, 0);
    const totalInput = raw.reduce((s, r) => s + r.inputBMD, 0);

    // formatting ke string hanya dilakukan setelah sorting & penjumlahan
    const items = raw.map((r, i) => ({
        ...r,
        no: i + 1,
        realisasiAnggaran: formatAngka(r.realisasiAnggaran),
        inputBMD: formatAngka(r.inputBMD),
        selisih: formatAngka(r.selisih),
        persentase: formatPersen(r.persentase),
    }));

    return {
        items,
        totalRealisasi: formatAngka(totalRealisasi),
        totalInput: formatAngka(totalInput),
        totalSelisih: formatAngka(totalRealisasi - totalInput),
        totalPersentase: formatPersen(
            hitungPersentase(totalInput, totalRealisasi)
        ),
    };
};

export const generateDraftSuratHasilRekon = (
    {
        asetTetap,
        persediaan,
        pemeliharaan,
    }: {
        asetTetap: RekonRow[];
        persediaan: RekonRow[];
        pemeliharaan: RekonRow[];
    },
    { tahun, bulan }: { tahun: number; bulan: number }
) => {
    const at = formatKategori(asetTetap);
    const ps = formatKategori(persediaan);
    const pm = formatKategori(pemeliharaan);

    generateDocument(
        "/template/rekon/laporan-hasil-rekon.docx",
        `Laporan Hasil Rekon - ${bulan} - ${tahun}`,
        {
            "surat-tanggal": "${tanggal_naskah}",
            "surat-nomor": "${nomor_naskah}",
            "surat-ttd": "${ttd_pengirim}",

            "bulan": daftarBulan[bulan - 1],
            "bulan-c": daftarBulan[bulan - 1].toUpperCase(),
            "tahun": tahun,

            "aset-tetap": at.items,
            "aset-tetap-realisasi-anggaran": at.totalRealisasi,
            "aset-tetap-input-bmd": at.totalInput,
            "aset-tetap-selisih": at.totalSelisih,
            "aset-tetap-persentase": at.totalPersentase,

            "persediaan": ps.items,
            "persediaan-realisasi-anggaran": ps.totalRealisasi,
            "persediaan-input-bmd": ps.totalInput,
            "persediaan-selisih": ps.totalSelisih,
            "persediaan-persentase": ps.totalPersentase,

            "pemeliharaan": pm.items,
            "pemeliharaan-realisasi-anggaran": pm.totalRealisasi,
            "pemeliharaan-input-bmd": pm.totalInput,
            "pemeliharaan-selisih": pm.totalSelisih,
            "pemeliharaan-persentase": pm.totalPersentase,
        }
    );
};