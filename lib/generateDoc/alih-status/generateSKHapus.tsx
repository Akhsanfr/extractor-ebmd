import { generateDocument } from "..";
import { angkaKeKata, formatRupiah, sumDecimal } from "@/lib/number";
import { AlihStatusSKHapusContract } from "@/action/alih-status/sk-hapus/contract";
import { AlihStatusType } from "@/enum/alihStatus";
import { PerangkatDaerah, PerangkatDaerahJabatan } from "@/enum/perangkatDaerah";

export const generateSKHapus = ({
    SKHapus,
    persetujuanBupati,
    permohonanPenghapusan,
    bast,
    data,
}: AlihStatusSKHapusContract.SelectWithDetailDTO) => {

    const formatTanggal = (tanggal: string | null) =>
        tanggal
            ? new Intl.DateTimeFormat("id-ID", {
                day: "numeric",
                month: "long",
                year: "numeric",
            }).format(new Date(tanggal))
            : "TANGGAL SURAT BAST";

    type SuratBerTanggal = {
        id: number | string;
        suratTanggal: Date | string | null | undefined;
    };

    const isTanggalValid = (v: SuratBerTanggal["suratTanggal"]) =>
        v != null && v !== "" && !Number.isNaN(new Date(v).getTime());

    const idTanggalKosong = (rows: SuratBerTanggal[]) =>
        rows.filter((r) => !isTanggalValid(r.suratTanggal)).map((r) => r.id);

    const byTanggal = <T extends SuratBerTanggal>(a: T, b: T) =>
        new Date(a.suratTanggal!).getTime() - new Date(b.suratTanggal!).getTime();

    const persetujuanPenyerahan = persetujuanBupati.filter(
        (s) => s.alihStatusType === AlihStatusType.PENYERAHAN_KEPADA_PENGELOLA,
    );
    const persetujuanPengalihan = persetujuanBupati.filter(
        (s) =>
            s.alihStatusType === AlihStatusType.PENGALIHAN_STATUS_PENGGUNAAN ||
            s.alihStatusType === AlihStatusType.PENGALIHAN_STATUS_PENGGUNAAN_DARI_PENGELOLA,
    );

    // Guard: pastikan semua tanggal terisi sebelum diurutkan dan diformat
    const bupatiKosong = idTanggalKosong([...persetujuanPenyerahan, ...persetujuanPengalihan]);
    const bastKosong = idTanggalKosong(bast);

    if (bupatiKosong.length > 0 || bastKosong.length > 0) {
        const detail = [
            bupatiKosong.length > 0 && `Persetujuan Bupati (id: ${bupatiKosong.join(", ")})`,
            bastKosong.length > 0 && `BAST (id: ${bastKosong.join(", ")})`,
        ]
            .filter(Boolean)
            .join("; ");

        throw new Error(`Tanggal surat belum diisi pada ${detail}`);
    }

    const items: string[] = [
        ...[...persetujuanPenyerahan]
            .sort(byTanggal)
            .map((p) => `Surat Keputusan Bupati Nomor ${p.suratNomor} Tanggal ${formatTanggal(p.suratTanggal!)} Perihal ${p.suratHal}`),
        ...[...persetujuanPengalihan]
            .sort(byTanggal)
            .map((p) => `Surat Persetujuan Bupati Nomor ${p.suratNomor} Tanggal ${formatTanggal(p.suratTanggal!)} Perihal ${p.suratHal}`),
        ...[...bast]
            .sort(byTanggal)
            .map((b) => `Berita Acara Serah Terima antara ${b.perangkatDaerahAsal} Nomor ${b.suratNomor} Tanggal ${formatTanggal(b.suratTanggal!)}`),
    ];

    const memperhatikan: string[] = items.map((text, i) =>
        i === items.length - 2 ? `${text}; dan` : `${text};`,
    );

    const perangkatDaerahAsalUnik = [...new Set(data.map((item) => item.perangkatDaerahAsal))].filter(item => item !== null);
    const perangkatDaerahAsal =
        perangkatDaerahAsalUnik.length > 1
            ? `${angkaKeKata(perangkatDaerahAsalUnik.length)} Perangkat Daerah`
            : perangkatDaerahAsalUnik[0] ?? "";

    const perangkatDaerahUnik = new Set(data.map((item) => item.perangkatDaerahTujuan));
    const perangkatDaerahTujuan =
        perangkatDaerahUnik.size > 1
            ? `${angkaKeKata(perangkatDaerahUnik.size)} Perangkat Daerah`
            : [...perangkatDaerahUnik][0] ?? "";

    const assetTypeUnik = [...new Set(data.map((item) => item.assetType))];
    const objek =
        assetTypeUnik.length <= 1
            ? assetTypeUnik.join("")
            : assetTypeUnik.length === 2
                ? assetTypeUnik.join(" dan ")
                : `${assetTypeUnik.slice(0, -1).join(", ")} dan ${assetTypeUnik.at(-1)}`;

    const tembusan = [
        ...new Set([
            "Inspektorat Daerah",
            "Badan Keuangan dan Aset Daerah",
            ...perangkatDaerahAsalUnik,
        ]),
    ];

    generateDocument(
        "/template/alih-status/sk-hapus.docx",
        `SK Hapus - ${perangkatDaerahAsal}`,
        {
            "sk-hapus-nomor": SKHapus.suratNomor,

            "sk-hapus-tanggal": SKHapus.suratTanggal
                ? new Date(
                    `${SKHapus.suratTanggal}T00:00:00`,
                ).toLocaleDateString("id-ID", {
                    day: "numeric",
                    month: "long",
                    year: "numeric",
                })
                : `               ${new Date().getFullYear()}`,

            "sk-hapus-hal": SKHapus.suratHal,
            "sk-hapus-hal-c": SKHapus.suratHal?.toUpperCase(),

            "objek": objek,

            "objek-c": objek.toUpperCase(),

            "perangkat-daerah-asal": perangkatDaerahAsal,
            "perangkat-daerah-tujuan": perangkatDaerahTujuan,

            "perangkat-daerah-asal-c":
                perangkatDaerahAsal?.toUpperCase(),

            "memperhatikan": memperhatikan,

            "tembusan": tembusan.map(e => PerangkatDaerahJabatan[e as PerangkatDaerah]),

            "data": data.map((item, index) => ({
                ...item,
                no: index + 1,
                nilaiPerolehan: formatRupiah(item.nilaiPerolehan),
                akumulasiPenyusutan: formatRupiah(item.akumulasiPenyusutan),
                nilaiBuku: formatRupiah(item.nilaiBuku),
            })),

            "total-data": data.length,

            "total-perolehan": formatRupiah(
                sumDecimal(data.map((d) => d.nilaiPerolehan)),
            ),

            "total-penyusutan": formatRupiah(
                sumDecimal(data.map((d) => d.akumulasiPenyusutan)),
            ),

            "total-buku": formatRupiah(
                sumDecimal(data.map((d) => d.nilaiBuku)),
            ),
        },
    );
    generateDocument(
        "/template/alih-status/npknd-sk-hapus.docx",
        `NPKND SK Hapus - ${perangkatDaerahAsal}`,
        {
            "sk-hapus-tahun": SKHapus.tahun,
            "sk-hapus-hal": SKHapus.suratHal
        },
    );
};