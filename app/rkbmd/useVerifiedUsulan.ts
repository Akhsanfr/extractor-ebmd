import { useState, useEffect, useMemo, useCallback } from "react";
import { PerangkatDaerahJson } from "@/types/perangkatDaerah";
import { ProgramKegiatanJson, Renja, VerifiedUsulan } from "@/types/rkbmd";
import { buildVerifiedList, countNotVerified } from "./verificationUtil";

// ── Filter ────────────────────────────────────────────────────────────────────

export type UsulanFilter = {
    penggunaBarang: string;
    kuasaPenggunaBarang: string;
    program: string;
    kegiatan: string;
    onlyInvalid: boolean;
};

export type UsulanFilterOptions = {
    penggunaBarang: string[];
    kuasaPenggunaBarang: string[];
    program: string[];
    kegiatan: string[];
};

export const EMPTY_FILTER: UsulanFilter = {
    penggunaBarang: "",
    kuasaPenggunaBarang: "",
    program: "",
    kegiatan: "",
    onlyInvalid: false,
};

// ── Return type ───────────────────────────────────────────────────────────────

interface UseVerifiedUsulanReturn<T extends Renja> {
    /** Data asli (tanpa verified flag) */
    data: T[];
    /** Seluruh data dengan flag verified — belum difilter */
    verifiedData: VerifiedUsulan<T>[];
    /** Data setelah filter diterapkan — gunakan ini untuk render tabel */
    filteredData: VerifiedUsulan<T>[];
    /** true jika seluruh item (dari verifiedData) sudah terverifikasi */
    isAllVerified: boolean;
    /** Jumlah item yang gagal verifikasi */
    notVerifiedCount: number;
    /** State filter aktif */
    filter: UsulanFilter;
    /** Opsi dropdown per field, sudah di-scope ke pilihan upstream */
    filterOptions: UsulanFilterOptions;
    /** true jika ada filter yang aktif */
    isFilterActive: boolean;
    /** Set satu field filter. Downstream direset otomatis */
    setFilterField: <K extends keyof UsulanFilter>(key: K, value: UsulanFilter[K]) => void;
    /** Reset semua filter */
    resetFilter: () => void;
    /** Setter untuk data mentah (dipakai oleh handler add/edit/delete) */
    setData: React.Dispatch<React.SetStateAction<T[]>>;
}

// ── Hook ──────────────────────────────────────────────────────────────────────

/**
 * Hook generik untuk mengelola daftar usulan RKBMD beserta verifikasi dan filter-nya.
 *
 * Memverifikasi 4 field:
 *  - penggunaBarang & kuasaPenggunaBarang  → referensi perangkatDaerah.json
 *  - program                               → referensi program.json
 *  - kegiatan                              → pasangan sah dari program
 *
 * Filter yang tersedia: penggunaBarang, kuasaPenggunaBarang, program, kegiatan, onlyInvalid.
 * Downstream direset otomatis saat upstream berubah (misal ganti program → kegiatan dikosongkan).
 *
 * @example
 * const { filteredData, notVerifiedCount, filter, setFilterField, resetFilter, setData } =
 *     useVerifiedUsulan<ListPengadaan>(PENGADAAN_STORAGE_KEY);
 */
export function useVerifiedUsulan<T extends Renja>(
    storageKey: string,
    fallback: T[] = []
): UseVerifiedUsulanReturn<T> {
    const [data, setData] = useState<T[]>(fallback);
    const [pdList, setPdList] = useState<PerangkatDaerahJson[]>([]);
    const [programList, setProgramList] = useState<ProgramKegiatanJson[]>([]);
    const [isLoaded, setIsLoaded] = useState(false);
    const [filter, setFilter] = useState<UsulanFilter>(EMPTY_FILTER);

    // ── 1. Load dari localStorage ─────────────────────────────────────────
    useEffect(() => {
        try {
            const raw = localStorage.getItem(storageKey);
            if (raw) setData(JSON.parse(raw) as T[]);
        } catch (err) {
            console.error(`[useVerifiedUsulan] Gagal membaca ${storageKey}:`, err);
        } finally {
            setIsLoaded(true);
        }
    }, [storageKey]);

    // ── 2. Fetch referensi (paralel) ──────────────────────────────────────
    useEffect(() => {
        Promise.allSettled([
            fetch("/data/perangkatDaerah.json").then((r) => r.json()),
            fetch("/data/program.json").then((r) => r.json()),
        ]).then(([pdResult, progResult]) => {
            if (pdResult.status === "fulfilled") setPdList(pdResult.value as PerangkatDaerahJson[]);
            else console.error("[useVerifiedUsulan] Gagal load perangkatDaerah.json:", pdResult.reason);

            if (progResult.status === "fulfilled") setProgramList(progResult.value as ProgramKegiatanJson[]);
            else console.error("[useVerifiedUsulan] Gagal load program.json:", progResult.reason);
        });
    }, []);

    // ── 3. Autosave ───────────────────────────────────────────────────────
    useEffect(() => {
        if (!isLoaded) return;
        try {
            localStorage.setItem(storageKey, JSON.stringify(data));
        } catch (err) {
            console.error(`[useVerifiedUsulan] Gagal menyimpan ${storageKey}:`, err);
        }
    }, [data, isLoaded, storageKey]);

    // ── 4. Verified data ──────────────────────────────────────────────────
    const verifiedData = useMemo(
        () => buildVerifiedList(data, pdList, programList),
        [data, pdList, programList]
    );

    const notVerifiedCount = useMemo(
        () => countNotVerified(verifiedData),
        [verifiedData]
    );

    // ── 5. Filter options (scoped ke pilihan upstream) ────────────────────
    const filterOptions = useMemo<UsulanFilterOptions>(() => {
        const unique = (arr: string[]) => [...new Set(arr)].sort();

        const byPengguna = verifiedData.filter(
            (i) => !filter.penggunaBarang || i.penggunaBarang === filter.penggunaBarang
        );

        return {
            penggunaBarang: unique(verifiedData.map((i) => i.penggunaBarang)),
            kuasaPenggunaBarang: unique(byPengguna.map((i) => i.kuasaPenggunaBarang).filter(Boolean)),
            program: unique(byPengguna.map((i) => i.program)),
            kegiatan: unique(
                verifiedData
                    .filter((i) => !filter.program || i.program === filter.program)
                    .map((i) => i.kegiatan)
            ),
        };
    }, [verifiedData, filter.penggunaBarang, filter.program]);

    // ── 6. Filtered data ──────────────────────────────────────────────────
    const filteredData = useMemo(() => {
        return verifiedData.filter((item) => {
            if (filter.penggunaBarang && item.penggunaBarang !== filter.penggunaBarang) return false;
            if (filter.kuasaPenggunaBarang && item.kuasaPenggunaBarang !== filter.kuasaPenggunaBarang) return false;
            if (filter.program && item.program !== filter.program) return false;
            if (filter.kegiatan && item.kegiatan !== filter.kegiatan) return false;
            if (filter.onlyInvalid && item.isFullyVerified) return false;
            return true;
        });
    }, [verifiedData, filter]);

    const isFilterActive =
        filter.penggunaBarang !== "" ||
        filter.kuasaPenggunaBarang !== "" ||
        filter.program !== "" ||
        filter.kegiatan !== "" ||
        filter.onlyInvalid;

    // ── 7. Filter actions ─────────────────────────────────────────────────
    const setFilterField = useCallback(<K extends keyof UsulanFilter>(key: K, value: UsulanFilter[K]) => {
        setFilter((prev) => {
            const next = { ...prev, [key]: value };
            if (key === "penggunaBarang") {
                next.kuasaPenggunaBarang = "";
                next.program = "";
                next.kegiatan = "";
            }
            if (key === "program") next.kegiatan = "";
            return next;
        });
    }, []);

    const resetFilter = useCallback(() => setFilter(EMPTY_FILTER), []);

    return {
        data,
        verifiedData,
        filteredData,
        isAllVerified: notVerifiedCount === 0,
        notVerifiedCount,
        filter,
        filterOptions,
        isFilterActive,
        setFilterField,
        resetFilter,
        setData,
    };
}