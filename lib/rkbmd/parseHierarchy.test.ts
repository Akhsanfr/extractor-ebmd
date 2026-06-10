import { describe, expect, it } from "vitest";
import { parseHierarchy } from "./parseHierarchy";
import { toLowerAlpha, toRoman, toUpperAlpha } from "../formater/convertAlfaNumeric";

describe("parseHierarchy", () => {
    const createState = () => ({
        curPengguna: "",
        curKuasa: "",
        curProgram: "",
        curKegiatan: "",
        curOutput: "",
    });

    describe("Pengguna Barang (Roman)", () => {
        it.each([
            ["I. DINAS LINGKUNGAN HIDUP", "DINAS LINGKUNGAN HIDUP"],
            ["II. DINAS PENDIDIKAN", "DINAS PENDIDIKAN"],
            ["XXVII. DINAS KESEHATAN", "DINAS KESEHATAN"],
            ["MMMCMXCIX. TEST", "TEST"],
        ])("should parse %s", (input, expected) => {
            const state = createState();

            parseHierarchy(input, state);

            expect(state.curPengguna).toBe(expected);
            expect(state.curKuasa).toBe("");
            expect(state.curProgram).toBe("");
            expect(state.curKegiatan).toBe("");
            expect(state.curOutput).toBe("");
        });

        it("should reset all child hierarchy", () => {
            const state = {
                curPengguna: "",
                curKuasa: "UPTD A",
                curProgram: "Program A",
                curKegiatan: "Kegiatan A",
                curOutput: "Output A",
            };

            parseHierarchy("I. DINAS TEST", state);

            expect(state).toEqual({
                curPengguna: "DINAS TEST",
                curKuasa: "",
                curProgram: "",
                curKegiatan: "",
                curOutput: "",
            });
        });
    });

    describe("Kuasa Pengguna Barang", () => {
        it.each([
            ["1. UPTD LINGKUNGAN", "UPTD LINGKUNGAN"],
            ["2. UPTD PERSAMPAHAN", "UPTD PERSAMPAHAN"],
            ["10. UPTD PERTAMANAN", "UPTD PERTAMANAN"],
            ["999. UPTD TEST", "UPTD TEST"],
        ])("should parse %s", (input, expected) => {
            const state = createState();

            parseHierarchy(input, state);

            expect(state.curKuasa).toBe(expected);
        });

        it("should reset child hierarchy", () => {
            const state = {
                curPengguna: "DINAS",
                curKuasa: "",
                curProgram: "Program A",
                curKegiatan: "Kegiatan A",
                curOutput: "Output A",
            };

            parseHierarchy("1. UPTD TEST", state);

            expect(state).toEqual({
                curPengguna: "DINAS",
                curKuasa: "UPTD TEST",
                curProgram: "",
                curKegiatan: "",
                curOutput: "",
            });
        });
    });

    describe("Program", () => {
        it.each([
            ["A. Program A", "Program A"],
            ["B. Program B", "Program B"],
            ["Z. Program Z", "Program Z"],
            ["AA. Program AA", "Program AA"],
            ["AB. Program AB", "Program AB"],
            ["AZ. Program AZ", "Program AZ"],
            ["BA. Program BA", "Program BA"],
            ["ZZ. Program ZZ", "Program ZZ"],
            ["AAA. Program AAA", "Program AAA"],
        ])("should parse %s", (input, expected) => {
            const state = createState();

            parseHierarchy(input, state);

            expect(state.curProgram).toBe(expected);
        });

        it("should reset kegiatan and output", () => {
            const state = {
                curPengguna: "DINAS",
                curKuasa: "UPTD",
                curProgram: "",
                curKegiatan: "Kegiatan Lama",
                curOutput: "Output Lama",
            };

            parseHierarchy("AA. Program Baru", state);

            expect(state).toEqual({
                curPengguna: "DINAS",
                curKuasa: "UPTD",
                curProgram: "Program Baru",
                curKegiatan: "",
                curOutput: "",
            });
        });
    });

    describe("Kegiatan", () => {
        it.each([
            ["1) Kegiatan A", "Kegiatan A"],
            ["1). Kegiatan A", "Kegiatan A"],
            ["12). Kegiatan B", "Kegiatan B"],
            ["999). Kegiatan C", "Kegiatan C"],
        ])("should parse %s", (input, expected) => {
            const state = createState();

            parseHierarchy(input, state);

            expect(state.curKegiatan).toBe(expected);
        });

        it("should reset output", () => {
            const state = {
                curPengguna: "DINAS",
                curKuasa: "UPTD",
                curProgram: "PROGRAM",
                curKegiatan: "",
                curOutput: "OUTPUT LAMA",
            };

            parseHierarchy("1). Kegiatan Baru", state);

            expect(state).toEqual({
                curPengguna: "DINAS",
                curKuasa: "UPTD",
                curProgram: "PROGRAM",
                curKegiatan: "Kegiatan Baru",
                curOutput: "",
            });
        });
    });

    describe("Output", () => {
        it.each([
            ["a. Output A", "Output A"],
            ["b. Output B", "Output B"],
            ["z. Output Z", "Output Z"],
            ["aa. Output AA", "Output AA"],
            ["ab. Output AB", "Output AB"],
            ["az. Output AZ", "Output AZ"],
            ["ba. Output BA", "Output BA"],
            ["zz. Output ZZ", "Output ZZ"],
            ["aaa. Output AAA", "Output AAA"],
        ])("should parse %s", (input, expected) => {
            const state = createState();

            parseHierarchy(input, state);

            expect(state.curOutput).toBe(expected);
        });
    });

    describe("Full hierarchy flow", () => {
        it("should build hierarchy correctly", () => {
            const state = createState();

            parseHierarchy("I. DINAS LINGKUNGAN HIDUP", state);
            parseHierarchy("1. UPTD PERSAMPAHAN", state);
            parseHierarchy("AA. Program Pengelolaan Sampah", state);
            parseHierarchy("1). Pengurangan Sampah", state);
            parseHierarchy("aa. Jumlah Dokumen Kajian", state);

            expect(state).toEqual({
                curPengguna: "DINAS LINGKUNGAN HIDUP",
                curKuasa: "UPTD PERSAMPAHAN",
                curProgram: "Program Pengelolaan Sampah",
                curKegiatan: "Pengurangan Sampah",
                curOutput: "Jumlah Dokumen Kajian",
            });
        });
    });

    describe("Invalid format", () => {
        it.each([
            [""],
            ["Random Text"],
            ["Program A"],
            ["123"],
            ["...."],
            ["A Program"],
            ["1 Kegiatan"],
        ])("should ignore %s", (input) => {
            const state = createState();

            parseHierarchy(input, state);

            expect(state).toEqual(createState());
        });
    });
    describe("Complex hierarchy with 5 children per level", () => {
        it("should parse and maintain state correctly across all branches", () => {
            const state = createState();

            const romanNumerals = ["I", "II", "III", "IV", "V"];
            const alphabetUpper = ["A", "B", "C", "D", "E"];
            const alphabetLower = ["a", "b", "c", "d", "e"];

            // 1. Pengguna Barang (Tanpa indentasi)
            for (let p = 0; p < 5; p++) {
                parseHierarchy(`${romanNumerals[p]}. DINAS ${p + 1}`, state);

                expect(state).toEqual({
                    curPengguna: `DINAS ${p + 1}`,
                    curKuasa: "",
                    curProgram: "",
                    curKegiatan: "",
                    curOutput: "",
                });

                // 2. Kuasa Pengguna Barang (Indentasi 4 spasi)
                for (let k = 1; k <= 5; k++) {
                    parseHierarchy(`    ${k}. UPTD ${k}`, state);

                    expect(state.curKuasa).toBe(`UPTD ${k}`);
                    expect(state.curProgram).toBe("");

                    // 3. Program (Indentasi 8 spasi)
                    for (let pr = 0; pr < 5; pr++) {
                        parseHierarchy(`        ${alphabetUpper[pr]}. Program ${pr + 1}`, state);

                        expect(state.curProgram).toBe(`Program ${pr + 1}`);
                        expect(state.curKegiatan).toBe("");

                        // 4. Kegiatan (Indentasi 12 spasi)
                        for (let kg = 1; kg <= 5; kg++) {
                            parseHierarchy(`            ${kg}). Kegiatan ${kg}`, state);

                            expect(state.curKegiatan).toBe(`Kegiatan ${kg}`);
                            expect(state.curOutput).toBe("");

                            // 5. Output (Indentasi 16 spasi)
                            for (let o = 0; o < 5; o++) {
                                parseHierarchy(`                ${alphabetLower[o]}. Output ${o + 1}`, state);

                                expect(state).toEqual({
                                    curPengguna: `DINAS ${p + 1}`,
                                    curKuasa: `UPTD ${k}`,
                                    curProgram: `Program ${pr + 1}`,
                                    curKegiatan: `Kegiatan ${kg}`,
                                    curOutput: `Output ${o + 1}`,
                                });
                            }
                        }
                    }
                }
            }
        });
    });

    describe("Extreme hierarchy scaling (100 children per level)", () => {
        it("should parse up to 100 items per level sequentially without memory crash", () => {
            const state = createState();

            // 1. Uji 100 Pengguna Barang (Roman)
            // Menguji "I." sampai "C."
            for (let p = 1; p <= 100; p++) {
                const romanStr = toRoman(p);
                parseHierarchy(`${romanStr}. DINAS ${p}`, state);

                expect(state.curPengguna).toBe(`DINAS ${p}`);
                expect(state.curKuasa).toBe(""); // Pastikan reset berjalan
            }

            // Kunci state di Pengguna Barang terakhir
            parseHierarchy(`C. DINAS 100`, state);

            // 2. Uji 100 Kuasa Pengguna Barang (Angka)
            for (let k = 1; k <= 100; k++) {
                parseHierarchy(`    ${k}. UPTD ${k}`, state);

                expect(state.curPengguna).toBe("DINAS 100"); // Parent tidak boleh hilang
                expect(state.curKuasa).toBe(`UPTD ${k}`);
                expect(state.curProgram).toBe("");
            }

            // Kunci state di Kuasa terakhir
            parseHierarchy(`    100. UPTD 100`, state);

            // 3. Uji 100 Program (Uppercase)
            // Menguji "A." sampai "CV." (tergantung implementasi toUpperAlpha)
            for (let pr = 0; pr < 100; pr++) {
                const alphaUpStr = toUpperAlpha(pr);
                parseHierarchy(`        ${alphaUpStr}. Program ${pr + 1}`, state);

                expect(state.curProgram).toBe(`Program ${pr + 1}`);
                expect(state.curKegiatan).toBe("");
            }

            // Kunci state di Program terakhir
            parseHierarchy(`        ${toUpperAlpha(99)}. Program 100`, state);

            // 4. Uji 100 Kegiatan (Angka dengan kurung)
            for (let kg = 1; kg <= 100; kg++) {
                parseHierarchy(`            ${kg}). Kegiatan ${kg}`, state);

                expect(state.curKegiatan).toBe(`Kegiatan ${kg}`);
                expect(state.curOutput).toBe("");
            }

            // Kunci state di Kegiatan terakhir
            parseHierarchy(`            100). Kegiatan 100`, state);

            // 5. Uji 100 Output (Lowercase)
            // Menguji "a." sampai "cv."
            for (let o = 0; o < 100; o++) {
                const alphaLowStr = toLowerAlpha(o);
                parseHierarchy(`                ${alphaLowStr}. Output ${o + 1}`, state);

                // Cek full state di level ujung untuk urutan ke-1 sampai ke-100
                expect(state).toEqual({
                    curPengguna: "DINAS 100",
                    curKuasa: "UPTD 100",
                    curProgram: "Program 100",
                    curKegiatan: "Kegiatan 100",
                    curOutput: `Output ${o + 1}`,
                });
            }
        });
    });
});