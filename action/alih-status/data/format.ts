import BaPenelitian from "@/app/dashboard/alih-status/ba-penelitian/page";
import { BmdAssetType, BmdAssetTypeLabel } from "@/enum/bmd";
import { parseRupiah } from "@/lib/number"
import { ExcelRow } from "@/lib/xlsx/parseXlsx"


const BmdAssetTypeFromLabel = Object.fromEntries(
    Object.entries(BmdAssetTypeLabel).map(([value, label]) => [
        label.toLowerCase(),
        value,
    ]),
) as Record<string, BmdAssetType>;

export const AlihStatusDataFormat = {
    import: (d: ExcelRow[]) => {
        return d.map((row, index) => ({
            kodeBarang: row[0],
            nibar: String(row[1]) === "null" ? null : String(row[1]),
            kodeRegister: String(row[2]),
            namaBarangKategori: row[3],
            merkTipe: row[4],
            nomorPolisi: row[5],
            nomorRangka: row[6],
            nomorMesin: row[7],
            kondisi: row[8],
            lokasi: row[9],
            tahun: row[10],
            asalUsul: row[11],
            jumlah: row[12],
            luas: row[13],
            nilaiPerolehan: parseRupiah(row[14]),
            akumulasiPenyusutan: parseRupiah(row[15]),
            nilaiBuku: parseRupiah(row[16]),
            perangkatDaerahAsal: row[17],
            perangkatDaerahTujuan: row[18],
            assetType: BmdAssetTypeFromLabel[
                String(row[19]).trim().toLowerCase()
            ],
            spkmbId: null,
            permohonanId: null,
            BAPenelitianId: null,
            persetujuanBupatiId: null,
            bastId: null,
            permohonanPenghapusanId: null,
            SKHapusId: null,
            nodinId: null,


            originalIndex: index,
        }));
    },
};