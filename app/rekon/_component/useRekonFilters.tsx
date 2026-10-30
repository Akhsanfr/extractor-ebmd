"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useCallback, useMemo } from "react";

import { isRekonPic, type RekonPic, type RekonRow } from "./rekonUtil";

// Semua filter hidup di URL: ?tahun=2026&bulan=10&jenis=...&q=dinas&pd=12&pic=Ian
type ParamKey = "tahun" | "bulan" | "jenis" | "q" | "pd" | "pic";
type ParamPatch = Partial<Record<ParamKey, string | number | null>>;

export type RekonFilterDefaults<TType extends string> = {
    tahun: number;
    bulan: number;
    rekonType: TType;
};

/**
 * `validTypes` harus konstanta di level modul (bukan array baru tiap render).
 * Nilai URL yang tidak valid jatuh ke default, jadi link yang salah/lama tidak merusak halaman.
 */
export function useRekonFilters<TType extends string>(
    defaults: RekonFilterDefaults<TType>,
    validTypes: readonly TType[],
) {
    const router = useRouter();
    const pathname = usePathname();
    const searchParams = useSearchParams();
    const paramString = searchParams.toString();

    const filters = useMemo(() => {
        const params = new URLSearchParams(paramString);
        const tahun = Number(params.get("tahun"));
        const bulan = Number(params.get("bulan"));
        const jenis = params.get("jenis");

        return {
            tahun: Number.isInteger(tahun) && tahun >= 2000 ? tahun : defaults.tahun,
            bulan: Number.isInteger(bulan) && bulan >= 1 && bulan <= 12 ? bulan : defaults.bulan,
            rekonType: validTypes.includes(jenis as TType) ? (jenis as TType) : defaults.rekonType,
            q: params.get("q") ?? "",
            pd: params.get("pd") || null,
            // PIC yang tidak dikenal di URL diabaikan.
            pic: isRekonPic(params.get("pic")) ? (params.get("pic") as RekonPic) : null,
        };
    }, [paramString, defaults.tahun, defaults.bulan, defaults.rekonType, validTypes]);

    // replace (bukan push) supaya mengetik/memilih filter tidak memenuhi riwayat browser.
    const update = useCallback(
        (patch: ParamPatch) => {
            const next = new URLSearchParams(paramString);
            for (const [key, value] of Object.entries(patch)) {
                if (value === null || value === undefined || value === "") next.delete(key);
                else next.set(key, String(value));
            }
            const qs = next.toString();
            router.replace(qs ? `${pathname}?${qs}` : pathname, { scroll: false });
        },
        [paramString, pathname, router],
    );

    const setTahun = useCallback((tahun: number) => update({ tahun }), [update]);
    const setBulan = useCallback((bulan: number) => update({ bulan }), [update]);
    const setQuery = useCallback((q: string) => update({ q }), [update]);
    const setPerangkatDaerah = useCallback((pd: string | null) => update({ pd }), [update]);
    const setPic = useCallback((pic: RekonPic | null) => update({ pic }), [update]);
    const resetFilters = useCallback(() => update({ q: null, pd: null, pic: null }), [update]);

    // Pindah rekonType: search, perangkat daerah, dan PIC ikut ter-reset. Tahun/bulan dipertahankan.
    const setRekonType = useCallback(
        (jenis: TType) => update({ jenis, q: null, pd: null, pic: null }),
        [update],
    );

    return {
        ...filters,
        hasActiveFilter: filters.q !== "" || filters.pd !== null || filters.pic !== null,
        setTahun,
        setBulan,
        setRekonType,
        setQuery,
        setPerangkatDaerah,
        setPic,
        resetFilters,
    };
}

export type PerangkatDaerahOption = { id: string; nama: string };

// Opsi dropdown diambil dari data yang BELUM difilter, jadi pilihan tidak menyusut setelah memfilter.
export function getPerangkatDaerahOptions(rows: RekonRow[]): PerangkatDaerahOption[] {
    const map = new Map<string, string>();
    for (const row of rows) map.set(String(row.perangkatDaerahId), row.perangkatDaerahNama);
    return [...map]
        .map(([id, nama]) => ({ id, nama }))
        .sort((a, b) => a.nama.localeCompare(b.nama, "id"));
}

export function filterRekonRows(
    rows: RekonRow[],
    { q, pd, pic }: { q: string; pd: string | null; pic: RekonPic | null },
) {
    const needle = q.trim().toLowerCase();
    // pd dari URL yang tidak ada di data (mis. link dari rekonType lain) diabaikan, bukan menghasilkan tabel kosong.
    const pdValid = pd !== null && rows.some((r) => String(r.perangkatDaerahId) === pd);

    return rows.filter(
        (row) =>
            (!pdValid || String(row.perangkatDaerahId) === pd) &&
            (pic === null || row.pic === pic) &&
            (needle === "" || row.perangkatDaerahNama.toLowerCase().includes(needle)),
    );
}