export const parseRupiah = (value: unknown): number => {
    if (typeof value === "number") return value;

    const normalized = String(value ?? "")
        .trim()
        .replace(/\./g, "")
        .replace(",", ".")
        .replace("(", "-")
        .replace(")", "");

    return Number(normalized);
};

export const formatRupiah = (value: number | string | null) => {
    if (value === null) return "-";

    return Number(value).toLocaleString("id-ID", {
        style: "currency",
        currency: "IDR",
        minimumFractionDigits: 0,
        maximumFractionDigits: 0,
    });
};