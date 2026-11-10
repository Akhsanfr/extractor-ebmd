"use client";
import {
    Autocomplete,
    Button,
    Chip,
    ListBox,
    SearchField,
    Select,
    useFilter,
    type Key,
} from "@heroui/react";
import { CalendarDays, FilterX } from "lucide-react";
import { useState } from "react";
import { REKON_PIC_OPTIONS, type RekonPic } from "./rekonUtil";
import type { PerangkatDaerahOption } from "./useRekonFilters";
import type { RekonRow } from "./rekonUtil";

const ALL = "all";

export default function RekonFilterBar({
    perangkatDaerahId,
    onPerangkatDaerahChange,
    pic,
    onPicChange,
    tanggal,
    onTanggalChange,
    tanggalOptions,
    options,
    hasActiveFilter,
    onReset,
}: {
    perangkatDaerahId: string | null; // nilai dari URL
    onPerangkatDaerahChange: (id: string | null) => void;
    pic: RekonPic | null; // nilai dari URL
    onPicChange: (pic: RekonPic | null) => void;
    tanggal: TanggalFilter;
    onTanggalChange: (next: TanggalFilter) => void;
    tanggalOptions: TanggalFacet[]; // facet: tanggal + jumlah baris
    options: PerangkatDaerahOption[];
    hasActiveFilter: boolean;
    onReset: () => void;
}) {
    const [tanggalOpen, setTanggalOpen] = useState(false);
    const { contains } = useFilter({ sensitivity: "base" });

    const selectedPd =
        perangkatDaerahId && options.some((o) => o.id === perangkatDaerahId) ? perangkatDaerahId : null;
    const tanggalCount = countTanggalFilter(tanggal);

    return (
        <div className="mb-4 flex flex-col gap-3">
            <div className="flex flex-wrap items-center gap-3">
                <Autocomplete
                    className="w-full sm:w-80"
                    aria-label="Filter perangkat daerah"
                    placeholder="Semua perangkat daerah"
                    selectionMode="single"
                    value={selectedPd}
                    onChange={(key: Key | Key[] | null) => {
                        const k = Array.isArray(key) ? key[0] : key;
                        onPerangkatDaerahChange(k ? String(k) : null);
                    }}
                >
                    <Autocomplete.Trigger>
                        <Autocomplete.Value />
                        <Autocomplete.ClearButton />
                        <Autocomplete.Indicator />
                    </Autocomplete.Trigger>
                    <Autocomplete.Popover>
                        <Autocomplete.Filter filter={contains}>
                            <SearchField autoFocus name="search-perangkat-daerah" variant="secondary">
                                <SearchField.Group>
                                    <SearchField.SearchIcon />
                                    <SearchField.Input placeholder="Cari perangkat daerah" />
                                    <SearchField.ClearButton />
                                </SearchField.Group>
                            </SearchField>
                            <ListBox
                                renderEmptyState={() => (
                                    <div className="py-4 text-center text-sm text-muted">
                                        Perangkat daerah tidak ditemukan
                                    </div>
                                )}
                            >
                                {options.map((opt) => (
                                    <ListBox.Item key={opt.id} id={opt.id} textValue={opt.nama}>
                                        {opt.nama}
                                        <ListBox.ItemIndicator />
                                    </ListBox.Item>
                                ))}
                            </ListBox>
                        </Autocomplete.Filter>
                    </Autocomplete.Popover>
                </Autocomplete>

                <Select
                    className="w-full sm:w-48"
                    aria-label="Filter PIC"
                    value={pic ?? ALL}
                    onChange={(key: Key | null) => {
                        if (!key) return;
                        const next = String(key);
                        onPicChange(next === ALL ? null : (next as RekonPic));
                    }}
                >
                    <Select.Trigger>
                        <Select.Value />
                        <Select.Indicator />
                    </Select.Trigger>
                    <Select.Popover>
                        <ListBox>
                            <ListBox.Item id={ALL} textValue="Semua PIC">
                                Semua PIC
                                <ListBox.ItemIndicator />
                            </ListBox.Item>
                            {REKON_PIC_OPTIONS.map((name) => (
                                <ListBox.Item key={name} id={name} textValue={name}>
                                    {name}
                                    <ListBox.ItemIndicator />
                                </ListBox.Item>
                            ))}
                        </ListBox>
                    </Select.Popover>
                </Select>

                <Button
                    variant={tanggalOpen ? "secondary" : "outline"}
                    aria-expanded={tanggalOpen}
                    onPress={() => setTanggalOpen((v) => !v)}
                >
                    <CalendarDays size={16} aria-hidden />
                    Tanggal rekon
                    {tanggalCount > 0 && (
                        <Chip size="sm" variant="soft" color="accent">
                            <Chip.Label>{tanggalCount}</Chip.Label>
                        </Chip>
                    )}
                </Button>

                {hasActiveFilter && (
                    <Button variant="ghost" size="sm" onPress={onReset}>
                        <FilterX size={16} />
                        Reset filter
                    </Button>
                )}
            </div>

            {tanggalOpen && (
                <TanggalFilterPanel value={tanggal} onChange={onTanggalChange} options={tanggalOptions} />
            )}
        </div>
    );
}


/* ------------------------------------------------------------------ */
/* Format tanggal                                                      */
/* ------------------------------------------------------------------ */

// "2026-11-09" -> "Sen, 9 Nov 2026".
// Diparse manual dan diformat dengan timeZone UTC supaya tanggal tidak bergeser karena zona waktu browser.
const hariFmt = new Intl.DateTimeFormat("id-ID", { weekday: "short", timeZone: "UTC" });
const tanggalFmt = new Intl.DateTimeFormat("id-ID", {
    day: "numeric",
    month: "short",
    year: "numeric",
    timeZone: "UTC",
});

function parseIso(iso: string): Date | null {
    const [y, m, d] = iso.split("-").map(Number);
    const date = new Date(Date.UTC(y, m - 1, d));
    return Number.isNaN(date.getTime()) ? null : date;
}

export function formatTanggalSingkat(iso: string): string | null {
    const date = parseIso(iso);
    return date ? tanggalFmt.format(date) : null;
}

export function formatTanggalLengkap(iso: string): string | null {
    const date = parseIso(iso);
    return date ? `${hariFmt.format(date)}, ${tanggalFmt.format(date)}` : null;
}

/* ------------------------------------------------------------------ */
/* Model filter                                                        */
/* ------------------------------------------------------------------ */

// dates: pilihan dari faceting ("" = belum ada tanggal). from/to: rentang ISO (inklusif).
// Ketiganya digabung dengan AND.
export type TanggalFilter = { dates: string[]; from: string; to: string };
export const EMPTY_TANGGAL_FILTER: TanggalFilter = { dates: [], from: "", to: "" };

export const isTanggalFilterEmpty = (f: TanggalFilter) =>
    f.dates.length === 0 && !f.from && !f.to;

export const countTanggalFilter = (f: TanggalFilter) => f.dates.length + (f.from || f.to ? 1 : 0);

export function filterByTanggal(rows: RekonRow[], f: TanggalFilter): RekonRow[] {
    if (isTanggalFilterEmpty(f)) return rows;
    return rows.filter((row) => {
        const v = row.tanggalRekon ?? "";
        if (f.dates.length > 0 && !f.dates.includes(v)) return false;
        // ISO yyyy-mm-dd bisa dibandingkan sebagai string. Tanggal kosong tidak masuk rentang.
        if (f.from && (!v || v < f.from)) return false;
        if (f.to && (!v || v > f.to)) return false;
        return true;
    });
}

/* ------------------------------------------------------------------ */
/* Faceting                                                            */
/* ------------------------------------------------------------------ */

export type TanggalFacet = { key: string; count: number };

// Hitung baris per tanggal. Urut naik, "belum ada tanggal" ("") paling akhir.
// Berikan baris yang sudah kena filter lain (PD, PIC) tetapi BELUM kena filter tanggal,
// supaya jumlah di tiap chip mencerminkan filter lain.
export function getTanggalFacets(rows: RekonRow[]): TanggalFacet[] {
    const counts = new Map<string, number>();
    for (const row of rows) {
        const key = row.tanggalRekon ?? "";
        counts.set(key, (counts.get(key) ?? 0) + 1);
    }
    return Array.from(counts, ([key, count]) => ({ key, count })).sort((a, b) => {
        if (a.key === "") return 1;
        if (b.key === "") return -1;
        return a.key.localeCompare(b.key);
    });
}

/* ------------------------------------------------------------------ */
/* Panel                                                               */
/* ------------------------------------------------------------------ */

const dateInputClass =
    "h-8 rounded-lg border border-border bg-surface px-2 text-sm outline-none focus:border-accent";

export function TanggalFilterPanel({
    value,
    onChange,
    options,
}: {
    value: TanggalFilter;
    onChange: (next: TanggalFilter) => void;
    options: TanggalFacet[];
}) {
    const update = (patch: Partial<TanggalFilter>) => onChange({ ...value, ...patch });

    const toggle = (key: string) =>
        update({
            dates: value.dates.includes(key)
                ? value.dates.filter((d) => d !== key)
                : [...value.dates, key],
        });

    // Tanggal terpilih yang hilang dari facet (karena filter lain berubah) tetap ditampilkan
    // dengan jumlah 0, supaya bisa dilepas.
    const missing = value.dates
        .filter((d) => !options.some((o) => o.key === d))
        .map((key) => ({ key, count: 0 }));
    const all = [...options, ...missing];

    return (
        <div className="flex w-full flex-col gap-3 rounded-xl border border-border bg-surface p-3">
            <div className="flex flex-wrap items-end gap-3">
                <label className="flex flex-col gap-1 text-xs text-muted">
                    Dari tanggal
                    <input
                        type="date"
                        className={dateInputClass}
                        value={value.from}
                        max={value.to || undefined}
                        onChange={(e) => update({ from: e.target.value })}
                    />
                </label>
                <label className="flex flex-col gap-1 text-xs text-muted">
                    Sampai tanggal
                    <input
                        type="date"
                        className={dateInputClass}
                        value={value.to}
                        min={value.from || undefined}
                        onChange={(e) => update({ to: e.target.value })}
                    />
                </label>
            </div>

            <div className="flex flex-col gap-1.5">
                <span className="text-xs text-muted">Tanggal yang tersedia ({all.length})</span>
                {all.length === 0 ? (
                    <span className="text-sm text-muted">Tidak ada tanggal.</span>
                ) : (
                    <div className="flex max-h-32 flex-wrap gap-1.5 overflow-y-auto">
                        {all.map(({ key, count }) => {
                            const active = value.dates.includes(key);
                            const label = key === "" ? "Belum ada tanggal" : (formatTanggalSingkat(key) ?? key);
                            return (
                                <button
                                    key={key || "__kosong"}
                                    type="button"
                                    aria-pressed={active}
                                    onClick={() => toggle(key)}
                                    className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-xs transition-colors ${active
                                        ? "border-accent bg-accent/10 text-accent"
                                        : "border-border text-muted hover:text-foreground"
                                        }`}
                                >
                                    <span className="tabular-nums">{label}</span>
                                    <span className="tabular-nums opacity-70">{count}</span>
                                </button>
                            );
                        })}
                    </div>
                )}
            </div>
        </div>
    );
}