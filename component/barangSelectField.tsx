"use client";

import { useState, useEffect, useCallback } from "react";
import { BarangAll, ASET_LABEL } from "@/types/bmd";
import { loadAllFromStorage } from "@/lib/bmd-storage";
import { BarangTable } from "./barangTable";

interface BarangSelectFieldProps {
    value: BarangAll | null;
    onChange: (item: BarangAll) => void;
    error?: string;
}

export function BarangSelectField({ value, onChange, error }: BarangSelectFieldProps) {
    const [open, setOpen] = useState(false);
    const [data, setData] = useState<BarangAll[]>([]);

    const reload = useCallback(() => {
        setData(loadAllFromStorage());
    }, []);

    useEffect(() => {
        reload();
    }, [reload]);

    function handleSelect(item: BarangAll) {
        onChange(item);
        setOpen(false);
    }

    return (
        <>
            {/* ── Trigger field ── */}
            <div className="flex flex-col gap-1">
                <button
                    type="button"
                    onClick={() => { reload(); setOpen(true); }}
                    className={[
                        "w-full text-left text-sm px-3 py-2 rounded-lg border outline-none transition-all",
                        "bg-default-50 focus:bg-white",
                        error
                            ? "border-danger focus:border-danger"
                            : "border-default-300 focus:border-primary",
                    ].join(" ")}
                >
                    {value ? (
                        <span className="flex items-center gap-2">
                            <span className="font-medium text-default-900 truncate">{value.namaBarang}</span>
                            <span className="text-xs text-default-400 font-mono shrink-0">{value.kodeBarang}</span>
                        </span>
                    ) : (
                        <span className="text-default-400">Pilih barang...</span>
                    )}
                </button>

                {/* Preview barang terpilih */}
                {value && (
                    <div className="flex items-center justify-between text-xs px-1">
                        <span className="text-default-400">
                            {ASET_LABEL[value.asetType]} ·{" "}
                            <span className="text-default-600 font-medium">
                                {value.jumlah} {value.satuan} tersedia
                            </span>
                        </span>
                        <button
                            type="button"
                            onClick={() => onChange(null!)}
                            className="text-default-400 hover:text-danger transition-colors"
                        >
                            Hapus
                        </button>
                    </div>
                )}

                {error && <p className="text-xs text-danger">{error}</p>}
            </div>

            {/* ── Modal picker ── */}
            {open && (
                <>
                    <div
                        className="fixed inset-0 z-40 bg-black/40 backdrop-blur-sm"
                        onClick={() => setOpen(false)}
                    />
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 pointer-events-none">
                        <div
                            className={[
                                "pointer-events-auto w-full max-w-2xl max-h-[80vh]",
                                "bg-white rounded-2xl shadow-2xl border border-default-200",
                                "flex flex-col overflow-hidden",
                            ].join(" ")}
                            onClick={(e) => e.stopPropagation()}
                        >
                            {/* Header */}
                            <div className="flex items-center justify-between px-5 py-4 border-b border-default-100 shrink-0">
                                <div>
                                    <h3 className="text-sm font-semibold text-default-900">Pilih Barang</h3>
                                    <p className="text-xs text-default-400 mt-0.5">
                                        {data.length} barang tersedia
                                    </p>
                                </div>
                                <button
                                    onClick={() => setOpen(false)}
                                    className="text-default-400 hover:text-default-700 transition-colors"
                                >
                                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                                        <line x1="18" y1="6" x2="6" y2="18" />
                                        <line x1="6" y1="6" x2="18" y2="18" />
                                    </svg>
                                </button>
                            </div>

                            {/* Body — tabel select */}
                            <div className="flex-1 overflow-y-auto px-5 py-4">
                                <BarangTable
                                    data={data}
                                    mode="select"
                                    onSelect={handleSelect}
                                    selectedKode={value?.kodeBarang}
                                    maxHeight="100%"
                                />
                            </div>
                        </div>
                    </div>
                </>
            )}
        </>
    );
}