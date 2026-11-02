import { RekonContract } from "@/action/rekon/contract";
import { generateDocument } from "..";
import { daftarBulan } from "@/lib/date";

type RekonRow = RekonContract.SelectWithPerangkatDaerahDTO;

// Struktural (year/month/day) supaya CalendarDate dari HeroUI DatePicker langsung kompatibel.
export type TanggalSederhana = { year: number; month: number; day: number };
export type RentangTanggal = { start: TanggalSederhana; end: TanggalSederhana };

const angkaFormatter = new Intl.NumberFormat("id-ID", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
});

// 1000000 -> "1.000.000,00"
const formatAngka = (n: number) => angkaFormatter.format(n);



const hitungSelisih = (inputBMD: number, realisasi: number) =>
    Math.max(realisasi - inputBMD, 0);

// 100 -> "100,00%"
const formatPersen = (n: number) => `${angkaFormatter.format(n)}%`;

const hitungPersentase = (inputBMD: number, realisasi: number) =>
    realisasi > 0 ? Math.min((inputBMD / realisasi) * 100, 100) : 100;

// 30 Okt - 1 Nov 2026 -> "30 Oktober - 1 November 2026"
// 15 - 16 Nov 2026    -> "15 - 16 November 2026"
// beda tahun          -> "30 Desember 2026 - 2 Januari 2027"
// satu hari           -> "15 November 2026"
export const formatTanggalPelaksanaan = ({ start, end }: RentangTanggal) => {
    const bulanStart = daftarBulan[start.month - 1];
    const bulanEnd = daftarBulan[end.month - 1];

    if (start.year !== end.year) {
        return `${start.day} ${bulanStart} ${start.year} - ${end.day} ${bulanEnd} ${end.year}`;
    }
    if (start.month !== end.month) {
        return `${start.day} ${bulanStart} - ${end.day} ${bulanEnd} ${end.year}`;
    }
    if (start.day !== end.day) {
        return `${start.day} - ${end.day} ${bulanEnd} ${end.year}`;
    }
    return `${end.day} ${bulanEnd} ${end.year}`;
};

const formatKategori = (rows: RekonRow[]) => {
    const raw = rows
        .map((r) => {
            const realisasi = Number(r.realisasiAnggaran) || 0;
            const input = Number(r.inputBMD) || 0;

            return {
                ...r,
                realisasiAnggaran: realisasi,
                inputBMD: input,
                selisih: hitungSelisih(input, realisasi),
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
        totalSelisih: formatAngka(hitungSelisih(totalInput, totalRealisasi)),
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
    {
        tahun,
        bulan,
        pelaksanaan,
    }: { tahun: number; bulan: number; pelaksanaan: RentangTanggal }
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

            "tanggal-pelaksanaan": formatTanggalPelaksanaan(pelaksanaan),

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