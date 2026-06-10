import { describe, expect, it } from "vitest";
import {
    toLowerAlpha,
    toUpperAlpha,
    toRoman,
    fromLowerAlpha,
    fromUpperAlpha,
    fromRoman,
} from "./convertAlfaNumeric";

describe("Alphabet Conversion", () => {
    describe("toLowerAlpha", () => {
        it.each([
            [0, "a"],
            [1, "b"],
            [25, "z"],
            [26, "aa"],
            [27, "ab"],
            [51, "az"],
            [52, "ba"],
            [77, "bz"],
            [78, "ca"],
            [701, "zz"],
            [702, "aaa"],
            [703, "aab"],
            [728, "aba"],
            [18277, "zzz"],
            [18278, "aaaa"],
        ])("%i -> %s", (input, expected) => {
            expect(toLowerAlpha(input)).toBe(expected);
        });
    });

    describe("toUpperAlpha", () => {
        it.each([
            [0, "A"],
            [1, "B"],
            [25, "Z"],
            [26, "AA"],
            [27, "AB"],
            [51, "AZ"],
            [52, "BA"],
            [77, "BZ"],
            [78, "CA"],
            [701, "ZZ"],
            [702, "AAA"],
            [703, "AAB"],
            [728, "ABA"],
            [18277, "ZZZ"],
            [18278, "AAAA"],
        ])("%i -> %s", (input, expected) => {
            expect(toUpperAlpha(input)).toBe(expected);
        });
    });

    describe("fromLowerAlpha", () => {
        it.each([
            ["a", 0],
            ["b", 1],
            ["z", 25],
            ["aa", 26],
            ["ab", 27],
            ["az", 51],
            ["ba", 52],
            ["zz", 701],
            ["aaa", 702],
            ["aab", 703],
            ["aba", 728],
            ["zzz", 18277],
            ["aaaa", 18278],
        ])("%s -> %i", (input, expected) => {
            expect(fromLowerAlpha(input)).toBe(expected);
        });

        it("should be reversible for first 10000 values", () => {
            for (let i = 0; i < 10000; i++) {
                expect(fromLowerAlpha(toLowerAlpha(i))).toBe(i);
            }
        });

        it("should accept uppercase input", () => {
            expect(fromLowerAlpha("AA")).toBe(26);
            expect(fromLowerAlpha("ZZ")).toBe(701);
        });
    });

    describe("fromUpperAlpha", () => {
        it.each([
            ["A", 0],
            ["B", 1],
            ["Z", 25],
            ["AA", 26],
            ["AB", 27],
            ["AZ", 51],
            ["BA", 52],
            ["ZZ", 701],
            ["AAA", 702],
            ["AAB", 703],
            ["ABA", 728],
            ["ZZZ", 18277],
            ["AAAA", 18278],
        ])("%s -> %i", (input, expected) => {
            expect(fromUpperAlpha(input)).toBe(expected);
        });

        it("should be reversible for first 10000 values", () => {
            for (let i = 0; i < 10000; i++) {
                expect(fromUpperAlpha(toUpperAlpha(i))).toBe(i);
            }
        });

        it("should accept lowercase input", () => {
            expect(fromUpperAlpha("aa")).toBe(26);
            expect(fromUpperAlpha("zz")).toBe(701);
        });
    });
});

describe("Roman Conversion", () => {
    describe("toRoman", () => {
        it.each([
            [1, "I"],
            [2, "II"],
            [3, "III"],
            [4, "IV"],
            [5, "V"],
            [9, "IX"],
            [10, "X"],
            [14, "XIV"],
            [19, "XIX"],
            [40, "XL"],
            [49, "XLIX"],
            [90, "XC"],
            [99, "XCIX"],
            [400, "CD"],
            [444, "CDXLIV"],
            [500, "D"],
            [900, "CM"],
            [944, "CMXLIV"],
            [1000, "M"],
            [1984, "MCMLXXXIV"],
            [1994, "MCMXCIV"],
            [2026, "MMXXVI"],
            [3999, "MMMCMXCIX"],
        ])("%i -> %s", (input, expected) => {
            expect(toRoman(input)).toBe(expected);
        });
    });

    describe("fromRoman", () => {
        it.each([
            ["I", 1],
            ["II", 2],
            ["III", 3],
            ["IV", 4],
            ["V", 5],
            ["IX", 9],
            ["X", 10],
            ["XIV", 14],
            ["XIX", 19],
            ["XL", 40],
            ["XLIX", 49],
            ["XC", 90],
            ["XCIX", 99],
            ["CD", 400],
            ["CDXLIV", 444],
            ["D", 500],
            ["CM", 900],
            ["CMXLIV", 944],
            ["M", 1000],
            ["MCMLXXXIV", 1984],
            ["MCMXCIV", 1994],
            ["MMXXVI", 2026],
            ["MMMCMXCIX", 3999],
        ])("%s -> %i", (input, expected) => {
            expect(fromRoman(input)).toBe(expected);
        });

        it("should be reversible for all valid roman numbers", () => {
            for (let i = 1; i <= 3999; i++) {
                expect(fromRoman(toRoman(i))).toBe(i);
            }
        });

        it("should survive random stress test", () => {
            for (let i = 0; i < 1000; i++) {
                const value =
                    Math.floor(Math.random() * 3999) + 1;

                expect(
                    fromRoman(toRoman(value))
                ).toBe(value);
            }
        });

        it("should preserve boundary values", () => {
            expect(fromRoman(toRoman(1))).toBe(1);
            expect(fromRoman(toRoman(3999))).toBe(3999);
        });
    });
});