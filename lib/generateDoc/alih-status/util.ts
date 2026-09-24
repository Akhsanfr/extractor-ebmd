import { angkaKeKata } from "@/lib/number";

export const getUniquePerangkatDaerah = <T>(
    values: T[],
): T | string => {
    if (values.length === 0) {
        throw new Error("Values tidak boleh kosong");
    }

    const uniqueValues = new Set(values);

    if (uniqueValues.size === 1) {
        return uniqueValues.values().next().value as T;
    }

    return angkaKeKata(uniqueValues.size);
};