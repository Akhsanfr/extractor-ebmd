"use client";

import { useState } from "react";
import { Barang, ASET_LABEL, AsetType, ALL_ASET_TYPES } from "@/types/bmd"

type FilterKey = AsetType | "semua";

interface BarangTableProps {
    data: Barang[];
    // Mode "view" → tabel biasa, tidak ada interaksi pilih
    // Mode "select" → row bisa diklik, tampil tombol pilih
    mode?: "view" | "select";
    onSelect?: (item: Barang) => void;
    // Highlight row yang sudah dipilih (opsional, untuk select mode)
    selectedKode?: string;
    // Sembunyikan kolom kategori (opsional, misal sudah difilter 1 kategori)
    hideKategori?: boolean;
    maxHeight?: string;
}

export function BarangTable({
    data,
    mode = "view",
    onSelect,
    selectedKode,
    hideKategori = false,
    maxHeight = "600px",
}: BarangTableProps) {
    const [filterAset, setFilterAset] = useState<FilterKey>("semua");
    const [search, setSearch] = useState("");

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

    const summary = ALL_ASET_TYPES.map((key) => ({
        key,
        count: data.filter((d) => d.asetType === key).length,
    }));

    const isSelectable = mode === "select" && !!onSelect;
    const hasData = filtered.length > 0;

    return (
        <div className="flex flex-col gap-3">

            {/* ── Filter chips ── */}
            <div className="flex flex-wrap gap-2">
                <Chip
                    active={filterAset === "semua"}
                    onClick={() => setFilterAset("semua")}
                >
                    Semua · {data.length}
                </Chip>
                {summary.map(({ key, count }) => (
                    <Chip
                        key={key}
                        active={filterAset === key}
                        disabled={count === 0}
                        onClick={() => count > 0 && setFilterAset(key)}
                    >
                        {ASET_LABEL[key]} · {count}
                    </Chip>
                ))}
            </div>

            {/* ── Search ── */}
            <div className="flex items-center gap-2">
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
                        className="text-xs text-default-400 hover:text-default-700 whitespace-nowrap"
                    >
                        Hapus
                    </button>
                )}
                <span className="text-xs text-default-400 whitespace-nowrap">
                    {filtered.length} item
                </span>
            </div>

            {/* ── Hint select mode ── */}
            {isSelectable && hasData && (
                <p className="text-xs text-default-400 flex items-center gap-1.5">
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                        <path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4" />
                        <polyline points="10 17 15 12 10 7" />
                        <line x1="15" y1="12" x2="3" y2="12" />
                    </svg>
                    Klik baris untuk memilih barang
                </p>
            )}

            {/* ── Tabel ── */}
            {hasData ? (
                <div
                    className="overflow-y-auto rounded-lg border border-default-200"
                    style={{ maxHeight }}
                >
                    <table className="w-full text-sm">
                        <thead className="sticky top-0 bg-default-100 z-10">
                            <tr>
                                <th className="text-left py-2 px-3 font-medium w-10">No</th>
                                <th className="text-left py-2 px-3 font-medium">Kode Barang</th>
                                <th className="text-left py-2 px-3 font-medium">Nama Barang</th>
                                <th className="text-right py-2 px-3 font-medium w-20">Jumlah</th>
                                <th className="text-left py-2 px-3 font-medium w-20">Satuan</th>
                                {!hideKategori && (
                                    <th className="text-left py-2 px-3 font-medium">Kategori</th>
                                )}
                                {isSelectable && <th className="w-8" />}
                            </tr>
                        </thead>
                        <tbody>
                            {filtered.map((item) => {
                                const isSelected = selectedKode === item.kodeBarang;
                                return (
                                    <tr
                                        key={`${item.asetType}-${item.kodeBarang}`}
                                        onClick={() => isSelectable && onSelect(item)}
                                        className={[
                                            "border-t border-default-100 transition-colors group",
                                            isSelectable ? "cursor-pointer" : "",
                                            isSelected
                                                ? "bg-primary/10 border-primary/20"
                                                : isSelectable
                                                    ? "hover:bg-primary/5 hover:border-primary/10"
                                                    : "hover:bg-default-50",
                                        ].join(" ")}
                                    >
                                        <td className="py-2 px-3 text-default-400 text-xs">{item.nomor}</td>
                                        <td className="py-2 px-3 font-mono text-xs text-default-600">{item.kodeBarang}</td>
                                        <td className={[
                                            "py-2 px-3 font-medium transition-colors",
                                            isSelected ? "text-primary" : isSelectable ? "group-hover:text-primary" : "",
                                        ].join(" ")}>
                                            {item.namaBarang}
                                        </td>
                                        <td className="py-2 px-3 text-right font-medium">{item.jumlah}</td>
                                        <td className="py-2 px-3 text-default-500">{item.satuan}</td>
                                        {!hideKategori && (
                                            <td className="py-2 px-3">
                                                <span className="text-xs px-2 py-0.5 rounded-full bg-default-100 text-default-600 whitespace-nowrap">
                                                    {ASET_LABEL[item.asetType]}
                                                </span>
                                            </td>
                                        )}
                                        {isSelectable && (
                                            <td className="py-2 px-3 text-center">
                                                {isSelected ? (
                                                    <span className="text-primary">
                                                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                                                            <polyline points="20 6 9 17 4 12" />
                                                        </svg>
                                                    </span>
                                                ) : (
                                                    <span className="opacity-0 group-hover:opacity-100 transition-opacity text-primary">
                                                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                                                            <line x1="12" y1="5" x2="12" y2="19" />
                                                            <line x1="5" y1="12" x2="19" y2="12" />
                                                        </svg>
                                                    </span>
                                                )}
                                            </td>
                                        )}
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>
            ) : (
                <div className="flex items-center justify-center py-14 text-default-400">
                    <p className="text-sm">
                        {data.length === 0
                            ? "Belum ada data."
                            : search
                                ? `Tidak ada hasil untuk "${search}".`
                                : "Tidak ada data untuk kategori ini."}
                    </p>
                </div>
            )}
        </div>
    );
}

// ─── Chip ─────────────────────────────────────────────────────────────────────

function Chip({
    children,
    active,
    disabled,
    onClick,
}: {
    children: React.ReactNode;
    active?: boolean;
    disabled?: boolean;
    onClick?: () => void;
}) {
    return (
        <button
            onClick={onClick}
            disabled={disabled}
            className={[
                "px-3 py-1 text-xs font-medium rounded-full border transition-all",
                active
                    ? "bg-primary text-primary-foreground border-primary"
                    : "border-default-300 text-default-500 hover:border-default-500 hover:text-default-800",
                disabled ? "opacity-40 cursor-default" : "",
            ].join(" ")}
        >
            {children}
        </button>
    );
}