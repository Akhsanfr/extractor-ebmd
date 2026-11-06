import { generateDocument } from "..";
import { angkaKeKata, formatRupiah, sumDecimal } from "@/lib/number";
import { replaceNullWithDash } from "@/lib/array";
import { AlihStatusPersetujuanBupatiContract } from "@/action/alih-status/persetujuan-bupati/contract";
import { AlihStatusType } from "@/enum/alihStatus";
import { formatTanggalSurat } from "@/lib/date";
import { joinDenganDan } from "@/lib/text";
import { PerangkatDaerah, PerangkatDaerahJabatan } from "@/enum/perangkatDaerah";
type SuratBerTanggal = {
    id: number | string;
    suratTanggal: Date | string | null | undefined;
};
const formatTanggal = (tanggal: string | null, fallback: string) =>
    tanggal
        ? new Intl.DateTimeFormat("id-ID", {
            day: "numeric",
            month: "long",
            year: "numeric",
        }).format(new Date(`${tanggal}T00:00:00`))
        : fallback;

export const generatePersetujuanBupati = ({
    persetujuanBupati,
    permohonan,
    nodin,
    data,
}: AlihStatusPersetujuanBupatiContract.SelectWithDetailDTO) => {
    if (data.length === 0) throw new Error("Data barang belum dipilih");


    const unik = (values: (string | null)[]) =>
        new Set(values.filter((v): v is string => !!v));
    const asalUnik = unik(data.map((d) => d.perangkatDaerahAsal));
    // const perangkatDaerahAsal =
    //     asalUnik.size > 1
    //         ? `${angkaKeKata(asalUnik.size)} Perangkat Daerah`
    //         : [...asalUnik][0] ?? "";
    const perangkatDaerahAsal =
        asalUnik.size > 1
            ? joinDenganDan([...asalUnik])
            : [...asalUnik][0] ?? "";

    const tujuanUnik = unik(data.map((d) => d.perangkatDaerahTujuan));
    const perangkatDaerahTujuan =
        tujuanUnik.size > 1
            ? `${angkaKeKata(tujuanUnik.size)} Perangkat Daerah`
            : [...tujuanUnik][0] ?? "";

    // Urutkan nodin berdasarkan tanggal (yang tanpa tanggal di akhir)
    const nodinFormatted = [...nodin]
        .sort((a, b) => {
            if (!a.suratTanggal && !b.suratTanggal) return 0;
            if (!a.suratTanggal) return 1;
            if (!b.suratTanggal) return -1;
            return a.suratTanggal.localeCompare(b.suratTanggal);
        })
        .map((n) => ({
            "nodin-nomor": n.suratNomor,
            "nodin-tanggal": formatTanggal(n.suratTanggal, "TANGGAL NOTA DINAS"),
            "nodin-hal": n.suratHal,
        }));

    const isTunggal = nodinFormatted.length === 1;
    const isJamak = nodinFormatted.length > 1;
    const tunggal = isTunggal ? nodinFormatted[0] : null;

    const persetujuanNomor = persetujuanBupati.suratNomor !== ""
        ? persetujuanBupati.suratNomor
        : `000.2.3.2/     /424.013/${new Date().getFullYear()}`;

    const byTanggal = <T extends SuratBerTanggal>(a: T, b: T) =>
        new Date(a.suratTanggal!).getTime() - new Date(b.suratTanggal!).getTime();
    const items: string[] = [
        ...[...permohonan]
            .sort(byTanggal)
            .map((p) => `Surat Permohonan Nomor ${p.suratNomor} Tanggal ${formatTanggalSurat(p.suratTanggal!)} Perihal ${p.suratHal}`),
    ];

    const memperhatikan: string[] = items.map((text, i) =>
        i === items.length - 2 ? `${text}; dan` : `${text}.`,
    );


    if (persetujuanBupati.alihStatusType === AlihStatusType.PENGALIHAN_STATUS_PENGGUNAAN) {

        if (nodin.length === 0) throw new Error("Nota dinas belum dipilih");


        generateDocument(
            "/template/alih-status/persetujuan-bupati.docx",
            `PERSETUJUAN BUPATI - ${persetujuanBupati.suratHal}`,
            {
                "persetujuan-nomor": persetujuanNomor,

                "persetujuan-tanggal": formatTanggal(persetujuanBupati.suratTanggal, `                    ${new Date().getFullYear()}`),

                "persetujuan-hal":
                    persetujuanBupati.suratHal !== ""
                        ? persetujuanBupati.suratHal
                        : "Persetujuan Pengalihan Status Penggunaan Barang Milik Daerah",

                // Nota dinas: tunggal (1 surat) -> field diakses langsung
                "nodin-tunggal": isTunggal,
                "nodin-nomor": tunggal?.["nodin-nomor"] ?? "",
                "nodin-tanggal": tunggal?.["nodin-tanggal"] ?? "",
                "nodin-hal": tunggal?.["nodin-hal"] ?? "",

                // Nota dinas: jamak (>1 surat) -> loop {#nodin}
                "nodin-jamak": isJamak,
                "nodin": nodinFormatted,

                "perangkat-daerah-asal-c": perangkatDaerahAsal.toUpperCase(),
                "perangkat-daerah-tujuan-c": perangkatDaerahTujuan.toUpperCase(),

                "data": data.map((item, index) =>
                    replaceNullWithDash({
                        ...item,
                        no: index + 1,
                        nilaiPerolehan: formatRupiah(item.nilaiPerolehan),
                        akumulasiPenyusutan: formatRupiah(item.akumulasiPenyusutan),
                        nilaiBuku: formatRupiah(item.nilaiBuku),
                    }),
                ),

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
    } else {
        const formatList = (items: string[]): string => {
            if (items.length <= 1) return items[0] ?? "";
            if (items.length === 2) return `${items[0]} dan ${items[1]}`;
            return `${items.slice(0, -1).join(", ")}, dan ${items[items.length - 1]}`;
        };

        // Ambil nilai unik, buang null/undefined/string kosong, dan rapikan spasi
        const uniqueNonEmpty = (values: Array<string | null | undefined>): string[] =>
            Array.from(
                new Set(
                    values
                        .map((v) => v?.trim())
                        .filter((v): v is string => !!v)
                )
            );

        const uniqueAssetType = uniqueNonEmpty(
            data.map((d) => d.assetType)
        );
        const jenisAset = uniqueAssetType.length
            ? `${formatList(uniqueAssetType)}`
            : "";

        const tembusan = [
            ...new Set([
                "Inspektorat Daerah",
                "Badan Keuangan dan Aset Daerah",
                ...asalUnik,
            ]),
        ];
        generateDocument(
            "/template/alih-status/sk-penyerahan.docx",
            `SK PENYERAHAN - ${persetujuanBupati.suratHal}`,
            {
                "sk-penyerahan-nomor": persetujuanNomor,

                "objek": jenisAset,

                "sk-penyerahan-tanggal": formatTanggal(persetujuanBupati.suratTanggal, `                    ${new Date().getFullYear()}`),

                "sk-penyerahan-hal": persetujuanBupati.suratHal,
                "sk-penyerahan-hal-c": persetujuanBupati.suratHal?.toUpperCase(),


                "perangkat-daerah-asal": perangkatDaerahAsal,
                "perangkat-daerah-asal-c": perangkatDaerahAsal.toUpperCase(),
                "perangkat-daerah-tujuan-c": perangkatDaerahTujuan.toUpperCase(),

                "memperhatikan": memperhatikan,

                "data": data.map((item, index) =>
                    replaceNullWithDash({
                        ...item,
                        no: index + 1,
                        nilaiPerolehan: formatRupiah(item.nilaiPerolehan),
                        akumulasiPenyusutan: formatRupiah(item.akumulasiPenyusutan),
                        nilaiBuku: formatRupiah(item.nilaiBuku),
                    }),
                ),
                "tembusan": tembusan.map(
                    (e, i) => `${PerangkatDaerahJabatan[e as PerangkatDaerah]}${i === tembusan.length - 1 ? "." : ";"}`
                ),

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
    }
    generateDocument(
        "/template/alih-status/npknd-persetujuan-bupati.docx",
        `NPKND SK Penyerahan - ${perangkatDaerahAsal}`,
        {
            "persetujuan-bupati-tahun": persetujuanBupati.tahun,
            "persetujuan-bupati-hal": persetujuanBupati.suratHal
        },
    );
};