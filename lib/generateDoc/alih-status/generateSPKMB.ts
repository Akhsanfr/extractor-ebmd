import { AlihStatusPermohonanContract } from "@/action/alih-status/permohonan/contract";
import { generateDocument } from "..";
import { replaceNullWithDash } from "@/lib/array";
import { formatRupiah, sumDecimal } from "@/lib/number";
import { PerangkatDaerahJabatan } from "@/enum/perangkatDaerah";

export const generateSPKMB = (value: AlihStatusPermohonanContract.SelectWithDetailDTO | undefined, id: number) => {
    if (!value) throw new Error("Data belum tersedia")
    const { permohonan, spkmb, data } = value
    if (!permohonan) throw new Error("Permohonan belum tersedia");
    const filteredData = data.filter(d => d.spkmbId === id)
    const filteredSpkmb = spkmb.find(s => s.id === id)
    if (filteredData.length === 0) throw new Error("Data belum tersedia");
    if (!filteredSpkmb) throw new Error("SPKMB belum tersedia");
    generateDocument("/template/alih-status/spkmb.docx", `SPKMB - ${permohonan.perangkatDaerahAsal} ke ${filteredSpkmb.perangkatDaerahTujuan}`, {
        "spkmb-nomor": filteredSpkmb.suratNomor,
        "spkmb-tanggal": filteredSpkmb.suratTanggal
            ? new Date(`${filteredSpkmb.suratTanggal}T00:00:00`).toLocaleDateString("id-ID", {
                day: "numeric",
                month: "long",
                year: "numeric",
            })
            : `               ${new Date().getFullYear()}`,
        "perangkat-daerah-asal": permohonan.perangkatDaerahAsal,
        "perangkat-daerah-asal-c": permohonan.perangkatDaerahAsal?.toUpperCase(),
        "perangkat-daerah-tujuan-c": filteredSpkmb.perangkatDaerahTujuan.toUpperCase(),
        "data": filteredData.map((item, index) => (replaceNullWithDash({
            ...item,
            no: index + 1,
            nilaiPerolehan: formatRupiah(item.nilaiPerolehan),
            akumulasiPenyusutan: formatRupiah(item.akumulasiPenyusutan),
            nilaiBuku: formatRupiah(item.nilaiBuku),
        }))),
        "pengguna-barang-tujuan-nama": filteredSpkmb.penggunaBarangTujuanNama,
        "pengguna-barang-tujuan-nip": filteredSpkmb.penggunaBarangTujuanNIP,
        "pengguna-barang-tujuan-pangkat": filteredSpkmb.penggunaBarangTujuanPangkat,
        "pengguna-barang-tujuan-jabatan": PerangkatDaerahJabatan[filteredSpkmb.perangkatDaerahTujuan],
        "pengguna-barang-tujuan-jabatan-c": PerangkatDaerahJabatan[filteredSpkmb.perangkatDaerahTujuan].toUpperCase(),
        "total-data": filteredData.length,
        "total-perolehan": formatRupiah(sumDecimal(filteredData.map(d => d.nilaiPerolehan))),
        "total-penyusutan": formatRupiah(sumDecimal(filteredData.map(d => d.akumulasiPenyusutan))),
        "total-buku": formatRupiah(sumDecimal(filteredData.map(d => d.nilaiBuku))),
    });
}