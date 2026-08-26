import { parseRupiah } from "@/lib/number"
import { ExcelRow } from "@/lib/xlsx/parseXlsx"

export const AlihStatusDataFormat = {
    import: (d: ExcelRow[]) => {
        return d.map((row, index) => ({
            kodeBarang: row[0],
            nibar: String(row[1]),
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
            nilaiPerolehan: parseRupiah(row[13]),
            akumulasiPenyusutan: parseRupiah(row[14]),
            nilaiBuku: parseRupiah(row[15]),
            perangkatDaerahTujuan: row[16],

            originalIndex: index,
        }));
    },
};