import { angkaKeKata } from "./number";

export function replaceNullWithDash<T extends Record<string, unknown>>(data: T) {
    return Object.fromEntries(
        Object.entries(data).map(([key, value]) => [
            key,
            value ?? "-",
        ]),
    ) as {
            [K in keyof T]: Exclude<T[K], null | undefined> | string;
        };
}

