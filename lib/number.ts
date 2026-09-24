import Decimal from "decimal.js";

export const parseRupiah = (value: unknown): number => {
    if (typeof value === "number") return isNaN(value) ? 0 : value;
    if (value === null || value === undefined) return 0;

    let str = String(value).trim();
    if (!str || str === "-") return 0;

    const isNegative = (str.startsWith("(") && str.endsWith(")")) || str.startsWith("-");
    str = str.replace(/[()]/g, "").replace(/^[+-]/, "").trim();
    str = str.replace(/^rp\.?\s*/i, "").replace(/^idr\s*/i, "").trim();

    if (str.includes(".") && str.includes(",")) {
        const lastDot = str.lastIndexOf(".");
        const lastComma = str.lastIndexOf(",");
        if (lastComma > lastDot) {
            str = str.replace(/\./g, "").replace(",", ".");
        } else {
            str = str.replace(/,/g, "");
        }
    } else if (str.includes(",")) {
        const parts = str.split(",");
        if (parts.length > 2) {
            str = str.replace(/,/g, "");
        } else if (parts.length === 2) {
            str = str.replace(",", ".");
        }
    } else if (str.includes(".")) {
        const parts = str.split(".");
        if (parts.length > 2) {
            str = str.replace(/\./g, "");
        } else if (parts.length === 2) {
            if (parts[1].length === 3) {
                str = str.replace(/\./g, "");
            }
        }
    }

    const num = Number(str);
    const result = isNaN(num) ? 0 : (isNegative ? -num : num);
    return result;
};

export const formatRupiah = (value: number | string | null | undefined, withFraction = true) => {
    if (value === null || value === undefined || value === "") return "-";
    const num = typeof value === "number" ? value : parseRupiah(value);
    if (isNaN(num)) return "-";

    const hasDecimal = num % 1 !== 0;

    return num.toLocaleString("id-ID", {
        style: "currency",
        currency: "IDR",
        minimumFractionDigits: withFraction && hasDecimal ? 2 : 0,
        maximumFractionDigits: withFraction ? 2 : 0,
    });
};
export const angkaKeKata = (angka: number): string => {
    const satuan = [
        "",
        "Satu",
        "Dua",
        "Tiga",
        "Empat",
        "Lima",
        "Enam",
        "Tujuh",
        "Delapan",
        "Sembilan",
        "Sepuluh",
        "Sebelas",
    ];

    if (angka < 12) {
        return satuan[angka];
    }

    if (angka < 20) {
        return `${angkaKeKata(angka - 10)} Belas`;
    }

    if (angka < 100) {
        return `${angkaKeKata(Math.floor(angka / 10))} Puluh ${angka % 10 !== 0 ? angkaKeKata(angka % 10) : ""
            }`.trim();
    }

    if (angka < 200) {
        return `Seratus ${angka % 100 !== 0 ? angkaKeKata(angka % 100) : ""
            }`.trim();
    }

    if (angka < 1000) {
        return `${angkaKeKata(Math.floor(angka / 100))} Ratus ${angka % 100 !== 0 ? angkaKeKata(angka % 100) : ""
            }`.trim();
    }

    if (angka < 2000) {
        return `Seribu ${angka % 1000 !== 0 ? angkaKeKata(angka % 1000) : ""
            }`.trim();
    }

    if (angka < 1_000_000) {
        return `${angkaKeKata(Math.floor(angka / 1000))} Ribu ${angka % 1000 !== 0 ? angkaKeKata(angka % 1000) : ""
            }`.trim();
    }

    return "";
};

// export function sumDecimal<T extends Record<string, any>>(data: T[], key: keyof T): number;
export function sumDecimal(values: (string | number | null | undefined)[]): number;
export function sumDecimal(
    dataOrValues: any[],
    key?: string,
): number {
    if (!Array.isArray(dataOrValues) || dataOrValues.length === 0) {
        return 0;
    }

    const values = key !== undefined
        ? dataOrValues.map((item) => (item ? item[key] : 0))
        : dataOrValues;

    return values.reduce((acc: Decimal, val) => {
        if (val === null || val === undefined || val === "" || val === "-") {
            return acc;
        }

        try {
            if (typeof val === "number") {
                return isNaN(val) ? acc : acc.plus(val);
            }
            const parsed = parseRupiah(val);
            return acc.plus(parsed);
        } catch {
            return acc;
        }
    }, new Decimal(0)).toNumber();
};