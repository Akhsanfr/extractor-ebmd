    const getAlphaBase = (i: number, startCharCode: number): string => {
        let result = "";
        let n = i;

        do {
            result = String.fromCharCode(startCharCode + (n % 26)) + result;
            n = Math.floor(n / 26) - 1;
        } while (n >= 0);

        return result;
    };

    export const toLowerAlpha = (i: number): string =>
        getAlphaBase(i, 97); // a-z

    export const toUpperAlpha = (i: number): string =>
        getAlphaBase(i, 65); // A-Z
    export const toRoman = (num: number): string => {
        const map: [number, string][] = [
            [1000, "M"],
            [900, "CM"],
            [500, "D"],
            [400, "CD"],
            [100, "C"],
            [90, "XC"],
            [50, "L"],
            [40, "XL"],
            [10, "X"],
            [9, "IX"],
            [5, "V"],
            [4, "IV"],
            [1, "I"],
        ];

        let result = "";

        for (const [value, symbol] of map) {
            while (num >= value) {
                result += symbol;
                num -= value;
            }
        }

        return result;
    };

    const fromAlphaBase = (
        value: string,
        startCharCode: number
    ): number => {
        let result = 0;

        for (let i = 0; i < value.length; i++) {
            const current =
                value.charCodeAt(i) - startCharCode + 1;

            result = result * 26 + current;
        }

        return result - 1;
    };

    export const fromUpperAlpha = (value: string): number =>
        fromAlphaBase(value.toUpperCase(), 65);

    export const fromLowerAlpha = (value: string): number =>
        fromAlphaBase(value.toLowerCase(), 97);

    export const fromRoman = (roman: string): number => {
        const map: Record<string, number> = {
            I: 1,
            V: 5,
            X: 10,
            L: 50,
            C: 100,
            D: 500,
            M: 1000,
        };

        let result = 0;

        for (let i = 0; i < roman.length; i++) {
            const current = map[roman[i]];
            const next = map[roman[i + 1]] ?? 0;

            if (current < next) {
                result -= current;
            } else {
                result += current;
            }
        }

        return result;
    };