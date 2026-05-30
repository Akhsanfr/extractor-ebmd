import { useState, useEffect, useMemo } from "react";
import { PerangkatDaerahJson } from "@/types/perangkatDaerah";
import { ProgramKegiatanJson, Renja, VerifiedUsulan } from "@/types/rkbmd";
import { buildVerifiedList, countNotVerified } from "./verificationUtil";

interface UseVerifiedUsulanReturn<T extends Renja> {
    /** Data asli (tanpa verified flag) */
    data: T[];
    /** Data dengan flag verified lengkap */
    verifiedData: VerifiedUsulan<T>[];
    /** true jika seluruh item sudah terverifikasi */
    isAllVerified: boolean;
    /** Jumlah item yang gagal verifikasi (≥ 1 field false) */
    notVerifiedCount: number;
    /** Setter untuk data mentah (dipakai oleh handler add/edit/delete) */
    setData: React.Dispatch<React.SetStateAction<T[]>>;
}

/**
 * Hook generik untuk mengelola daftar usulan RKBMD beserta status verifikasinya.
 *
 * Memverifikasi 4 field sekaligus:
 *  - penggunaBarang & kuasaPenggunaBarang  → referensi perangkatDaerah.json
 *  - program                               → referensi program.json
 *  - kegiatan                              → harus pasangan sah dari program di atas
 *
 * Dapat dipakai untuk pengadaan maupun pemeliharaan.
 *
 * @example — pengadaan
 * const { verifiedData, notVerifiedCount, setData } =
 *     useVerifiedUsulan<ListPengadaan>(PENGADAAN_STORAGE_KEY);
 *
 * @example — pemeliharaan
 * const { verifiedData, notVerifiedCount, setData } =
 *     useVerifiedUsulan<ListPemeliharaan>(PEMELIHARAAN_STORAGE_KEY);
 */
export function useVerifiedUsulan<T extends Renja>(
    storageKey: string,
    fallback: T[] = []
): UseVerifiedUsulanReturn<T> {
    const [data, setData] = useState<T[]>(fallback);
    const [pdList, setPdList] = useState<PerangkatDaerahJson[]>([]);
    const [programList, setProgramList] = useState<ProgramKegiatanJson[]>([]);
    const [isLoaded, setIsLoaded] = useState(false);

    // ── 1. Load dari localStorage ──────────────────────────────────────────
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

    // ── 2. Fetch referensi (paralel) ───────────────────────────────────────
    useEffect(() => {
        Promise.allSettled([
            fetch("/data/perangkatDaerah.json").then((r) => r.json()),
            fetch("/data/program.json").then((r) => r.json()),
        ]).then(([pdResult, progResult]) => {
            if (pdResult.status === "fulfilled") {
                setPdList(pdResult.value as PerangkatDaerahJson[]);
            } else {
                console.error("[useVerifiedUsulan] Gagal load perangkatDaerah.json:", pdResult.reason);
            }
            if (progResult.status === "fulfilled") {
                setProgramList(progResult.value as ProgramKegiatanJson[]);
            } else {
                console.error("[useVerifiedUsulan] Gagal load program.json:", progResult.reason);
            }
        });
    }, []);

    // ── 3. Autosave ke localStorage setiap kali data berubah ──────────────
    useEffect(() => {
        if (!isLoaded) return;
        try {
            localStorage.setItem(storageKey, JSON.stringify(data));
        } catch (err) {
            console.error(`[useVerifiedUsulan] Gagal menyimpan ${storageKey}:`, err);
        }
    }, [data, isLoaded, storageKey]);

    // ── 4. Derived state ───────────────────────────────────────────────────
    const verifiedData = useMemo(
        () => buildVerifiedList(data, pdList, programList),
        [data, pdList, programList]
    );

    const notVerifiedCount = useMemo(
        () => countNotVerified(verifiedData),
        [verifiedData]
    );

    return {
        data,
        verifiedData,
        isAllVerified: notVerifiedCount === 0,
        notVerifiedCount,
        setData,
    };
}