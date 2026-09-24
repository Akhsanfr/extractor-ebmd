import { generateDocument } from "..";
import { formatRupiah, sumDecimal } from "@/lib/number";
import { replaceNullWithDash } from "@/lib/array";
import { AlihStatusPermohonanPenghapusanContract } from "@/action/alih-status/permohonan-penghapusan/contract";

export const generatePermohonanPenghapusan = ({
    permohonanPenghapusan,
    bast,
    data,
}: AlihStatusPermohonanPenghapusanContract.SelectWithDetailDTO) => {

    console.log(bast)

    const formatTanggal = (tanggal: string | null) =>
        tanggal
            ? new Intl.DateTimeFormat("id-ID", {
                day: "numeric",
                month: "long",
                year: "numeric",
            }).format(new Date(tanggal))
            : "TANGGAL SURAT BAST";

    const bastFormatted = bast.sort((a, b) => {
        if (!a.suratTanggal && !b.suratTanggal) return 0;
        if (!a.suratTanggal) return 1;
        if (!b.suratTanggal) return -1;
        return a.suratTanggal.localeCompare(b.suratTanggal);
    }).map((b) => ({
        ...b,
        suratTanggal: formatTanggal(b.suratTanggal),
    }));

    const isTunggal = bast.length === 1;
    const isJamak = bast.length > 1;
    const tunggal = isTunggal ? bast[0] : null;

    generateDocument(
        "/template/alih-status/permohonan-penghapusan.docx",
        `Permohonan Penghapusan - ${permohonanPenghapusan.perangkatDaerahAsal}`,
        {
            "permohonan-penghapusan-nomor": permohonanPenghapusan.suratNomor,

            "permohonan-penghapusan-tanggal": permohonanPenghapusan.suratTanggal
                ? new Date(
                    `${permohonanPenghapusan.suratTanggal}T00:00:00`,
                ).toLocaleDateString("id-ID", {
                    day: "numeric",
                    month: "long",
                    year: "numeric",
                })
                : `               ${new Date().getFullYear()} (Maksimal 1 minggu setelah BAST)`,

            "permohonan-penghapusan-hal": permohonanPenghapusan.suratHal,

            "perangkat-daerah-asal": permohonanPenghapusan.perangkatDaerahAsal,

            "perangkat-daerah-asal-c":
                permohonanPenghapusan.perangkatDaerahAsal?.toUpperCase(),

            // Persetujuan bupati: tunggal (1 surat)
            "bast-tunggal": isTunggal,
            "bast-nomor": tunggal?.suratNomor ?? "",
            "bast-tanggal": tunggal?.suratTanggal ?? "",
            "perangkat-daerah-tujuan": bast[0].perangkatDaerahTujuan,

            // Persetujuan bupati: jamak (>1 surat)
            "bast-jamak": isJamak,
            "bast": bastFormatted,

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

            "pengguna-barang-asal-nama":
                permohonanPenghapusan.penggunaBarangAsalNama,

            "pengguna-barang-asal-nip":
                permohonanPenghapusan.penggunaBarangAsalNIP,

            "pengguna-barang-asal-pangkat":
                permohonanPenghapusan.penggunaBarangAsalPangkat,

            "pengguna-barang-asal-jabatan-c":
                permohonanPenghapusan.penggunaBarangAsalJabatan?.toUpperCase(),

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