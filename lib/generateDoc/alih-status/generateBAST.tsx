import { generateDocument } from "..";
import { formatRupiah, sumDecimal } from "@/lib/number";
import { replaceNullWithDash } from "@/lib/array";
import { AlihStatusBASTContract } from "@/action/alih-status/bast/contract";
import { formatTanggalSurat } from "@/lib/date";

export const generateBAST = ({
    bast,
    persetujuanBupati,
    data,
}: AlihStatusBASTContract.SelectWithDetailDTO) => {

    const tanggalBast = bast.suratTanggal !== null ? formatTanggalSurat(bast.suratTanggal) : null;

    const persetujuan = persetujuanBupati.sort((a, b) => {
        if (!a.suratTanggal && !b.suratTanggal) return 0;
        if (!a.suratTanggal) return 1;
        if (!b.suratTanggal) return -1;
        return a.suratTanggal.localeCompare(b.suratTanggal);
    }).map((s, index) => ({
        no: index + 1,
        suratNomor: s.suratNomor ?? "-",
        suratTanggal: s.suratTanggal
            ? new Date(`${s.suratTanggal}T00:00:00`).toLocaleDateString("id-ID", {
                day: "numeric",
                month: "long",
                year: "numeric",
            })
            : "-",
        suratHal: s.suratHal ?? "-",
    }));

    const isTunggal = persetujuan.length === 1;
    const isJamak = persetujuan.length > 1;
    const tunggal = isTunggal ? persetujuan[0] : null;

    return generateDocument(
        "/template/alih-status/bast.docx",
        `BAST - ${bast.perangkatDaerahAsal} ke ${bast.perangkatDaerahTujuan}`,
        {
            // Header & nomor
            "bast-nomor": bast.suratNomor,
            "bast-hari": tanggalBast?.hari ?? "HARI",
            "bast-tanggal": tanggalBast?.tanggal ?? "TANGGAL",
            "bast-bulan": tanggalBast?.bulan ?? "BULAN",
            "bast-tahun": tanggalBast?.tahun ?? `TAHUN (Maksimal 30 hari sejak ${persetujuan[0].suratTanggal})`,

            // Perangkat daerah
            "perangkat-daerah-asal": bast.perangkatDaerahAsal,
            "perangkat-daerah-asal-c": bast.perangkatDaerahAsal.toUpperCase(),
            "perangkat-daerah-tujuan": bast.perangkatDaerahTujuan,
            "perangkat-daerah-tujuan-c": bast.perangkatDaerahTujuan.toUpperCase(),

            // Pihak kesatu (asal)
            "pengguna-barang-asal-nama": bast.penggunaBarangAsalNama,
            "pengguna-barang-asal-nip": bast.penggunaBarangAsalNIP,
            "pengguna-barang-asal-pangkat": bast.penggunaBarangAsalPangkat,
            "pengguna-barang-asal-jabatan": bast.perangkatDaerahAsal,
            "pengguna-barang-asal-jabatan-c": bast.perangkatDaerahAsal.toUpperCase(),

            // Pihak kedua (tujuan)
            "pengguna-barang-tujuan-nama": bast.penggunaBarangTujuanNama,
            "pengguna-barang-tujuan-nip": bast.penggunaBarangTujuanNIP,
            "pengguna-barang-tujuan-pangkat": bast.penggunaBarangTujuanPangkat,
            "pengguna-barang-tujuan-jabatan": bast.perangkatDaerahTujuan,
            "pengguna-barang-tujuan-jabatan-c": bast.perangkatDaerahTujuan.toUpperCase(),

            // Persetujuan bupati: tunggal (1 surat)
            "persetujuan-bupati-tunggal": isTunggal,
            "persetujuan-bupati-nomor": tunggal?.suratNomor ?? "",
            "persetujuan-bupati-tanggal": tunggal?.suratTanggal ?? "",
            "persetujuan-bupati-hal": tunggal?.suratHal ?? "",

            // Persetujuan bupati: jamak (>1 surat)
            "persetujuan-bupati-jamak": isJamak,
            "persetujuan-bupati": persetujuan,

            // Lampiran
            data: data.map((item, index) =>
                replaceNullWithDash({
                    ...item,
                    no: index + 1,
                    nilaiPerolehan: formatRupiah(item.nilaiPerolehan),
                    akumulasiPenyusutan: formatRupiah(item.akumulasiPenyusutan),
                    nilaiBuku: formatRupiah(item.nilaiBuku),
                }),
            ),
            "total-data": data.length,
            "total-perolehan": formatRupiah(sumDecimal(data.map((d) => d.nilaiPerolehan))),
            "total-penyusutan": formatRupiah(sumDecimal(data.map((d) => d.akumulasiPenyusutan))),
            "total-buku": formatRupiah(sumDecimal(data.map((d) => d.nilaiBuku))),
        },
    );
};