import { generateDocument } from "..";
import { angkaKeKata, formatRupiah, sumDecimal } from "@/lib/number";
import { replaceNullWithDash } from "@/lib/array";
import { AlihStatusNodinContract } from "@/action/alih-status/nodin/contract";
import { joinDenganDan } from "@/lib/text";

export const generateNodin = ({
    permohonan,
    BAPenelitian,
    nodin,
    data,
}: AlihStatusNodinContract.SelectWithDetailDTO, isTTE: boolean) => {
    if (permohonan.length === 0) throw new Error("Permohonan belum dipilih");
    if (BAPenelitian.length === 0) throw new Error("Nota dinas belum dipilih");
    const formatTanggal = (tanggal: string | null) =>
        tanggal
            ? new Intl.DateTimeFormat("id-ID", {
                day: "numeric",
                month: "long",
                year: "numeric",
            }).format(new Date(tanggal))
            : "TANGGAL SURAT BAST";

    const perangkatDaerahAsalUnik = new Set(data.map((item) => item.perangkatDaerahAsal));
    const perangkatDaerahAsal =
        perangkatDaerahAsalUnik.size > 1
            ? `${angkaKeKata(perangkatDaerahAsalUnik.size)} Perangkat Daerah`
            : [...perangkatDaerahAsalUnik][0] ?? "";

    const perangkatDaerahTujuanUnik = new Set(data.map((item) => item.perangkatDaerahTujuan));
    const perangkatDaerahTujuan =
        perangkatDaerahTujuanUnik.size > 1
            ? `${angkaKeKata(perangkatDaerahTujuanUnik.size)} Perangkat Daerah`
            : [...perangkatDaerahTujuanUnik][0] ?? "";

    const BAPenelitianFormated = BAPenelitian.sort((a, b) => {
        if (!a.suratTanggal && !b.suratTanggal) return 0;
        if (!a.suratTanggal) return 1;
        if (!b.suratTanggal) return -1;
        return a.suratTanggal.localeCompare(b.suratTanggal);
    }).map((b) => ({
        ...b,
        suratTanggal: formatTanggal(b.suratTanggal),
    }));

    const isTunggal = BAPenelitian.length === 1;
    const isJamak = BAPenelitian.length > 1;
    const tunggal = isTunggal ? BAPenelitian[0] : null;

    generateDocument(
        "/template/alih-status/nodin.docx",
        `NODIN - ${nodin.suratHal}`,
        {
            "nodin-nomor": isTTE ? "${nomor_naskah}" : nodin.suratNomor !== "" ? nodin.suratNomor : `000.2.3.2/     /202/${new Date().getFullYear()}`,

            "nodin-tanggal": isTTE ? "${tanggal_naskah}" : nodin.suratTanggal
                ? new Date(
                    `${nodin.suratTanggal}T00:00:00`,
                ).toLocaleDateString("id-ID", {
                    day: "numeric",
                    month: "long",
                    year: "numeric",
                })
                : "${tanggal_naskah}",

            "nodin-hal": nodin.suratHal !== "" ? nodin.suratHal : "Permohonan Persetujuan Pengalihan Status Penggunaan Barang Milik Daerah",

            "nodin-qr": isTTE ? "${ttd_pengirim}" : "",

            "perangkat-daerah-asal": perangkatDaerahAsal,

            "perangkat-daerah-asal-c":
                perangkatDaerahAsal.toUpperCase(),

            // Persetujuan bupati: tunggal (1 surat)
            "ba-penelitian-tunggal": isTunggal,
            "ba-penelitian-nomor": tunggal?.suratNomor ?? "",
            "ba-penelitian-tanggal": tunggal?.suratTanggal ?? "",

            "perangkat-daerah-tujuan": perangkatDaerahTujuan,
            "perangkat-daerah-tujuan-c": perangkatDaerahTujuan.toUpperCase(),

            // Persetujuan bupati: jamak (>1 surat)
            "ba-penelitian-jamak": isJamak,
            "ba-penelitian": BAPenelitianFormated,
            "permohonan-alasan": joinDenganDan(permohonan.map((p) => p.alasan).filter(a => a !== null)),
            "data": data.map((item, index) =>
                replaceNullWithDash({
                    ...item,
                    no: index + 1,
                    nilaiPerolehan: formatRupiah(item.nilaiPerolehan),
                    akumulasiPenyusutan: formatRupiah(
                        item.akumulasiPenyusutan,
                    ),
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
};