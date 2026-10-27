import type Decimal from "decimal.js";

// Status visual untuk selisih (Realisasi - Input BMD). Dipakai tabel, ringkasan, dan modal edit.
// Kelas Tailwind ditulis lengkap agar ikut ter-generate.
export type SelisihStatus = {
    label: "Sesuai" | "Kurang" | "Lebih";
    chipColor: "success" | "warning" | "danger";
    textClass: string;
    barClass: string;
    softBgClass: string;
};

// selisih > 0: input BMD masih kurang. < 0: lebih. 0: sudah sama.
export function getSelisihStatus(selisih: Decimal): SelisihStatus {
    if (selisih.isZero()) {
        return {
            label: "Sesuai",
            chipColor: "success",
            textClass: "text-success",
            barClass: "bg-success",
            softBgClass: "bg-success/10 text-success",
        };
    }
    if (selisih.isPositive()) {
        return {
            label: "Kurang",
            chipColor: "warning",
            textClass: "text-warning",
            barClass: "bg-warning",
            softBgClass: "bg-warning/10 text-warning",
        };
    }
    return {
        label: "Lebih",
        chipColor: "danger",
        textClass: "text-danger",
        barClass: "bg-danger",
        softBgClass: "bg-danger/10 text-danger",
    };
}