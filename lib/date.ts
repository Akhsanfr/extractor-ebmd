
import {
    parseDate,
    getDayOfWeek,
    getLocalTimeZone,
    type CalendarDate,
} from "@internationalized/date";
import { angkaKeKata } from "./number";
export const formatTanggalSurat = (value: string): { hari: string, tanggal: string, bulan: string, tahun: string } => {


    const date = parseDate(value)
    const hariIndex = getDayOfWeek(date, "id-ID");

    const hari = [
        "Minggu",
        "Senin",
        "Selasa",
        "Rabu",
        "Kamis",
        "Jumat",
        "Sabtu",
    ][hariIndex];

    const bulan = [
        "Januari",
        "Februari",
        "Maret",
        "April",
        "Mei",
        "Juni",
        "Juli",
        "Agustus",
        "September",
        "Oktober",
        "November",
        "Desember",
    ][date.month - 1];

    return {
        hari,
        tanggal: angkaKeKata(date.day),
        bulan,
        tahun: angkaKeKata(date.year),
    };
};