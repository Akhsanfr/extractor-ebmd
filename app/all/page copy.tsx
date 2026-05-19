"use client";

import { useState, useEffect } from "react";
import { Button } from "@heroui/react";

// ─── Types (re-export dari page utama atau definisikan ulang) ─────────────────

export interface BarangMerged {
    nomor: number;
    kodeBarang: string;
    namaBarang: string;
    jumlah: number;
    satuan: string;
}

export type AsetType =
    | "tanah"
    | "peralatan_mesin"
    | "bangunan"
    | "jalan_irigasi_jaringan"
    | "aset_tetap_lainnya";

// ─── Constants ────────────────────────────────────────────────────────────────

const ASET_LABEL: Record<AsetType, string> = {
    tanah: "Tanah",
    peralatan_mesin: "Peralatan dan Mesin",
    bangunan: "Bangunan",
    jalan_irigasi_jaringan: "Jalan, Irigasi, dan Jaringan",
    aset_tetap_lainnya: "Aset Tetap Lainnya",
};

const ALL_ASET_TYPES = Object.keys(ASET_LABEL) as AsetType[];

const STORAGE_KEY = (asetType: AsetType) => `bmd_merged_${asetType}`;

// ─── Types lokal ──────────────────────────────────────────────────────────────

interface BarangAll extends BarangMerged {
    asetType: AsetType;
}

type FilterKey = AsetType | "semua";

// ─── localStorage helper ──────────────────────────────────────────────────────

function loadFromStorage(asetType: AsetType): BarangMerged[] {
    try {
        const raw = localStorage.getItem(STORAGE_KEY(asetType));
        return raw ? (JSON.parse(raw) as BarangMerged[]) : [];
    } catch {
        return [];
    }
}

// ─── MergedAllTable ───────────────────────────────────────────────────────────

export default function MergedAllTable() {
    const [data, setData] = useState<BarangAll[]>([]);
    const [filterAset, setFilterAset] = useState<FilterKey>("semua");
    const [search, setSearch] = useState("");

    function reload() {
        const all: BarangAll[] = [];

        for (const asetType of ALL_ASET_TYPES) {
            const items = loadFromStorage(asetType);
            for (const item of items) {
                all.push({ ...item, asetType });
            }
        }

        // Re-nomor global
        const renumbered = all.map((item, idx) => ({ ...item, nomor: idx + 1 }));
        setData(renumbered);

        console.info(
            `[MergedAllTable] reload: ${renumbered.length} total item dari ${ALL_ASET_TYPES.length} kategori`
        );
    }

    useEffect(() => {
        reload();
        window.addEventListener("focus", reload);
        return () => window.removeEventListener("focus", reload);
    }, []);

    // ─── Filter & Search ────────────────────────────────────────────────────────

    const filtered = data
        .filter((d) => filterAset === "semua" || d.asetType === filterAset)
        .filter((d) => {
            if (!search.trim()) return true;
            const q = search.toLowerCase();
            return (
                d.kodeBarang.toLowerCase().includes(q) ||
                d.namaBarang.toLowerCase().includes(q)
            );
        })
        .map((item, idx) => ({ ...item, nomor: idx + 1 }));

    // ─── Summary per kategori ───────────────────────────────────────────────────

    const summary = ALL_ASET_TYPES.map((key) => ({
        key,
        count: data.filter((d) => d.asetType === key).length,
    }));

    const hasData = filtered.length > 0;

    return (
        <div className="flex flex-col gap-4">

            {/* ── Summary chips ── */}
            <div className="flex flex-wrap gap-2">
                <button
                    onClick={() => setFilterAset("semua")}
                    className={[
                        "px-3 py-1 text-xs font-medium rounded-full border transition-all",
                        filterAset === "semua"
                            ? "bg-primary text-primary-foreground border-primary"
                            : "border-default-300 text-default-500 hover:border-default-500 hover:text-default-800",
                    ].join(" ")}
                >
                    Semua · {data.length}
                </button>

                {summary.map(({ key, count }) => (
                    <button
                        key={key}
                        onClick={() => setFilterAset(key)}
                        className={[
                            "px-3 py-1 text-xs font-medium rounded-full border transition-all",
                            filterAset === key
                                ? "bg-primary text-primary-foreground border-primary"
                                : "border-default-300 text-default-500 hover:border-default-500 hover:text-default-800",
                            count === 0 ? "opacity-40 cursor-default" : "",
                        ].join(" ")}
                    >
                        {ASET_LABEL[key]} · {count}
                    </button>
                ))}
            </div>

            {/* ── Toolbar: search + refresh ── */}
            <div className="flex items-center gap-3">
                <input
                    type="text"
                    placeholder="Cari kode atau nama barang..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className={[
                        "flex-1 text-sm px-3 py-1.5 rounded-lg border outline-none transition-all",
                        "border-default-300 bg-default-50 placeholder:text-default-400",
                        "focus:border-primary focus:bg-white",
                    ].join(" ")}
                />
                {search && (
                    <button
                        onClick={() => setSearch("")}
                        className="text-xs text-default-400 hover:text-default-700"
                    >
                        Hapus
                    </button>
                )}
                <Button size="sm" onPress={reload}>
                    Refresh
                </Button>
                <span className="text-sm text-default-400 whitespace-nowrap">
                    {filtered.length} item
                </span>
            </div>

            {/* ── Tabel ── */}
            {hasData ? (
                <div className="max-h-[600px] overflow-y-auto rounded-lg border border-default-200">
                    <table className="w-full text-sm">
                        <thead className="sticky top-0 bg-default-100 z-10">
                            <tr>
                                <th className="text-left py-2 px-3 font-medium w-10">No</th>
                                <th className="text-left py-2 px-3 font-medium">Kode Barang</th>
                                <th className="text-left py-2 px-3 font-medium">Nama Barang</th>
                                <th className="text-right py-2 px-3 font-medium w-20">Jumlah</th>
                                <th className="text-left py-2 px-3 font-medium w-20">Satuan</th>
                                <th className="text-left py-2 px-3 font-medium">Kategori</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filtered.map((item) => (
                                <tr
                                    key={`${item.asetType}-${item.kodeBarang}`}
                                    className="border-t border-default-100 hover:bg-default-50"
                                >
                                    <td className="py-2 px-3 text-default-400 text-xs">{item.nomor}</td>
                                    <td className="py-2 px-3 font-mono text-xs text-default-600">{item.kodeBarang}</td>
                                    <td className="py-2 px-3">{item.namaBarang}</td>
                                    <td className="py-2 px-3 text-right font-medium">{item.jumlah}</td>
                                    <td className="py-2 px-3 text-default-500">{item.satuan}</td>
                                    <td className="py-2 px-3">
                                        <span className="text-xs px-2 py-0.5 rounded-full bg-default-100 text-default-600 whitespace-nowrap">
                                            {ASET_LABEL[item.asetType]}
                                        </span>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            ) : (
                <div className="flex flex-col items-center justify-center py-16 text-default-400">
                    <p className="text-sm">
                        {data.length === 0
                            ? "Belum ada data. Upload file Excel di masing-masing tab terlebih dahulu."
                            : search
                                ? `Tidak ada hasil untuk "${search}".`
                                : "Tidak ada data untuk kategori ini."}
                    </p>
                </div>
            )}
        </div>
    );
}