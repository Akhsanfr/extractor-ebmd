import { AlihStatusBAPenelitianContract } from "@/action/alih-status/ba-penelitian/contract";
import { AlihStatusDataContract } from "@/action/alih-status/data/contract";
import { AlihStatusPermohonanContract } from "@/action/alih-status/permohonan/contract";
import { formatTanggalSurat } from "@/lib/date";
import { generateDocument } from "..";
import { angkaKeKata, formatRupiah } from "@/lib/number";
import { sumDecimal } from "@/lib/number";
import { joinDenganDan } from "@/lib/text";
const formatTanggal = (tanggal: string | null) =>
    tanggal
        ? new Intl.DateTimeFormat("id-ID", {
            day: "numeric",
            month: "long",
            year: "numeric",
        }).format(new Date(tanggal))
        : "TANGGAL SURAT PERMOHONAN";

export const generateBAPenelitian = ({ permohonan, BAPenelitian, data }: AlihStatusBAPenelitianContract.SelectWithDetailDTO) => {
    if (BAPenelitian === null) throw new Error("Data belum tersedia");
    if (permohonan === null) throw new Error("Permohonan belum tersedia");

    const tanggalBAPenelitian = BAPenelitian.suratTanggal !== null ? formatTanggalSurat(BAPenelitian.suratTanggal) : { hari: "HARI", tanggal: "TANGGAL", bulan: "BULAN", tahun: "TAHUN" };

    const perangkatDaerahUnik = new Set(data.map((item) => item.perangkatDaerahTujuan));
    const perangkatDaerahTujuan =
        perangkatDaerahUnik.size > 1
            ? `${angkaKeKata(perangkatDaerahUnik.size)} Perangkat Daerah`
            : [...perangkatDaerahUnik][0] ?? "";

    const assetTypeUnik = [...new Set(data.map((item) => item.assetType))];

    const permohoanFormatted = permohonan.sort((a, b) => {
        if (!a.suratTanggal && !b.suratTanggal) return 0;
        if (!a.suratTanggal) return 1;
        if (!b.suratTanggal) return -1;
        return a.suratTanggal.localeCompare(b.suratTanggal);
    }).map((b) => ({
        ...b,
        suratTanggal: formatTanggal(b.suratTanggal),
    }));

    const isTunggal = permohoanFormatted.length === 1;
    const isJamak = permohoanFormatted.length > 1;
    const tunggal = isTunggal ? permohoanFormatted[0] : null;

    const objek =
        assetTypeUnik.length <= 1
            ? assetTypeUnik.join("")
            : assetTypeUnik.length === 2
                ? assetTypeUnik.join(" dan ")
                : `${assetTypeUnik.slice(0, -1).join(", ")} dan ${assetTypeUnik.at(-1)}`;

    generateDocument("/template/alih-status/ba-penelitian.docx", `BA Penelitian - ${BAPenelitian.perangkatDaerahAsal}`, {
        "objek": objek,
        "objek-c": objek.toUpperCase(),
        // PROPERTY SURAT
        "ba-penelitian-nomor": BAPenelitian.suratNomor,
        "ba-penelitian-tanggal": BAPenelitian?.suratTanggal
            ? new Date(`${BAPenelitian?.suratTanggal}T00:00:00`).toLocaleDateString("id-ID", {
                day: "numeric",
                month: "long",
                year: "numeric",
            })
            : `               ${new Date().getFullYear()}`,
        "hari": tanggalBAPenelitian?.hari,
        "tanggal": tanggalBAPenelitian?.tanggal,
        "bulan": tanggalBAPenelitian?.bulan,
        "tahun": tanggalBAPenelitian?.tahun,

        // PERMOHONAN - TUNGGAL
        "permohonan-nomor": tunggal?.suratNomor,
        "permohonan-tanggal": tunggal?.suratTanggal
            ? new Date(`${tunggal?.suratTanggal}T00:00:00`).toLocaleDateString("id-ID", {
                day: "numeric",
                month: "long",
                year: "numeric",
            })
            : `               ${new Date().getFullYear()}`,
        "permohonan-hal": tunggal?.suratHal,

        // PERMOHONAN - JAMAK
        "permohonan-jamak": isJamak,
        "permohonan": permohoanFormatted,



        "permohonan-alasan": joinDenganDan(permohonan.map((p) => p.alasan).filter(a => a !== null)),
        "perangkat-daerah-asal": permohonan[0].perangkatDaerahAsal,
        "perangkat-daerah-asal-c": permohonan[0].perangkatDaerahAsal?.toUpperCase(),
        "perangkat-daerah-tujuan": perangkatDaerahTujuan,
        "perangkat-daerah-tujuan-c": perangkatDaerahTujuan.toUpperCase(),
        "data": data.map((item, index) => ({
            ...item,
            no: index + 1,
            nilaiPerolehan: formatRupiah(item.nilaiPerolehan),
            akumulasiPenyusutan: formatRupiah(item.akumulasiPenyusutan),
            nilaiBuku: formatRupiah(item.nilaiBuku),
        })),
        "pengguna-barang": BAPenelitian.penggunaBarangAsalNama,
        "pengurus-barang": BAPenelitian.pengurusBarangAsalNama,
        "total-data": data.length,
        "total-perolehan": formatRupiah(sumDecimal(data.map(d => d.nilaiPerolehan))),
        "total-penyusutan": formatRupiah(sumDecimal(data.map(d => d.akumulasiPenyusutan))),
        "total-buku": formatRupiah(sumDecimal(data.map(d => d.nilaiBuku))),
    });
}