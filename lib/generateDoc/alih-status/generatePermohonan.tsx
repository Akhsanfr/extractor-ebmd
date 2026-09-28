import { AlihStatusPermohonanContract } from "@/action/alih-status/permohonan/contract";
import { generateDocument } from "..";
import { angkaKeKata, formatRupiah, sumDecimal } from "@/lib/number";
import { getPerangkatDaerahJabatan, PerangkatDaerahJabatan } from "@/enum/perangkatDaerah";
import { getUniquePerangkatDaerah } from "./util";
import { replaceNullWithDash } from "@/lib/array";

export const generatePermohonan = ({ permohonan, spkmb, data }: AlihStatusPermohonanContract.SelectWithDetailDTO) => {
    const perangkatDaerahTujuan = getUniquePerangkatDaerah(
        data.map((d) => d.perangkatDaerahTujuan),
    );
    generateDocument("/template/alih-status/permohonan.docx", `Permohonan - ${permohonan.perangkatDaerahAsal} ke ${perangkatDaerahTujuan}`, {
        "permohonan-nomor": permohonan.suratNomor,
        "permohonan-tanggal": permohonan.suratTanggal
            ? new Date(`${permohonan.suratTanggal}T00:00:00`).toLocaleDateString("id-ID", {
                day: "numeric",
                month: "long",
                year: "numeric",
            })
            : `               ${new Date().getFullYear()}`,
        "permohonan-hal": permohonan.suratHal,
        "perangkat-daerah-asal": permohonan.perangkatDaerahAsal,
        "perangkat-daerah-asal-c": permohonan.perangkatDaerahAsal?.toUpperCase(),
        "perangkat-daerah-tujuan": perangkatDaerahTujuan,
        "perangkat-daerah-tujuan-c": perangkatDaerahTujuan.toUpperCase(),
        "alasan": permohonan.alasan,
        "spkmb": spkmb.map((s) => ({
            ...s,
            perangkatDaerahAsal: permohonan.perangkatDaerahAsal,
            suratTanggal: s.suratTanggal && new Intl.DateTimeFormat("id-ID", {
                day: "numeric",
                month: "long",
                year: "numeric",
            }).format(new Date(s.suratTanggal)),
        })),
        "data": data.map((item, index) => (replaceNullWithDash({
            ...item,
            no: index + 1,
            nilaiPerolehan: formatRupiah(item.nilaiPerolehan),
            akumulasiPenyusutan: formatRupiah(item.akumulasiPenyusutan),
            nilaiBuku: formatRupiah(item.nilaiBuku),
        }))),
        "pengguna-barang-asal-nama": permohonan.penggunaBarangAsalNama,
        "pengguna-barang-asal-nip": permohonan.penggunaBarangAsalNIP,
        "pengguna-barang-asal-pangkat": permohonan.penggunaBarangAsalPangkat,
        "pengguna-barang-asal-jabatan-c": getPerangkatDaerahJabatan(permohonan.perangkatDaerahAsal),
        "total-data": data.length,
        "total-perolehan": formatRupiah(sumDecimal(data.map(d => d.nilaiPerolehan))),
        "total-penyusutan": formatRupiah(sumDecimal(data.map(d => d.akumulasiPenyusutan))),
        "total-buku": formatRupiah(sumDecimal(data.map(d => d.nilaiBuku))),
    });
}