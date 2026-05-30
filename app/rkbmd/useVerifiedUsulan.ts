import { useState, useEffect, useMemo } from "react";
import { PerangkatDaerahJson } from "@/types/perangkatDaerah";
import { Renja, VerifiedUsulan } from "@/types/rkbmd";
import { buildVerifiedList, countNotVerified } from "./verificationUtil";

interface UseVerifiedUsulanReturn<T extends Renja> {
    /** Data asli (tanpa verified flag) */
    data: T[];
    /** Data dengan flag penggunaBarangVerified & kuasaPenggunaBarangVerified */
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
 * Dapat dipakai untuk pengadaan maupun pemeliharaan — cukup berikan
 * storageKey yang sesuai dan initialData bertipe T.
 *
 * @example — pengadaan
 * const { data, verifiedData, notVerifiedCount, setData } =
 *     useVerifiedUsulan<ListPengadaan>(PENGADAAN_STORAGE_KEY, []);
 *
 * @example — pemeliharaan
 * const { data, verifiedData, notVerifiedCount, setData } =
 *     useVerifiedUsulan<ListPemeliharaan>(PEMELIHARAAN_STORAGE_KEY, []);
 */
export function useVerifiedUsulan<T extends Renja>(
    storageKey: string,
    fallback: T[] = []
): UseVerifiedUsulanReturn<T> {
    const [data, setData] = useState<T[]>(fallback);
    const [pdList, setPdList] = useState<PerangkatDaerahJson[]>([]);
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

    // ── 2. Fetch referensi perangkat daerah ────────────────────────────────
    useEffect(() => {
        fetch("/data/perangkatDaerah.json")
            .then((res) => res.json())
            .then((json: PerangkatDaerahJson[]) => setPdList(json))
            .catch((err) =>
                console.error("[useVerifiedUsulan] Gagal load perangkatDaerah.json:", err)
            );
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
        () => buildVerifiedList(data, pdList),
        [data, pdList]
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