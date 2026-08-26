import { persistentAtom } from "@nanostores/persistent";

export const $year = persistentAtom<string | undefined>(
    "active-year",
    undefined
);
export function setYear(year: string | undefined) {
    $year.set(year);
}

export function clearYear() {
    $year.set(undefined);
}