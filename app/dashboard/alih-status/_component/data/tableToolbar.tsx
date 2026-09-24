"use client";

import { useEffect, useState } from "react";
import type { Column, Table as TanstackTable } from "@tanstack/react-table";
import { Input, Label, ListBox, Select } from "@heroui/react";
import { AlihStatusDataContract } from "@/action/alih-status/data/contract";
import { ALIH_STATUS_JENIS_BMD_OPTIONS, alihStatusTableFeatures } from "./tableColumn";

type AlihStatusTable = TanstackTable<typeof alihStatusTableFeatures, AlihStatusDataContract.SelectDTO>;
type AlihStatusColumn = Column<typeof alihStatusTableFeatures, AlihStatusDataContract.SelectDTO, unknown>;

// Debounce kecil khusus search input, tanpa dependency tambahan.
function useDebouncedValue<T>(value: T, delayMs: number) {
    const [debounced, setDebounced] = useState(value);

    useEffect(() => {
        const timer = setTimeout(() => setDebounced(value), delayMs);
        return () => clearTimeout(timer);
    }, [value, delayMs]);

    return debounced;
}

// Facet multi-select berbasis HeroUI v3 Select (compound: Select.Trigger /
// Select.Value / Select.Indicator / Select.Popover + ListBox.Item). Jumlah
// di sisi kanan tiap opsi datang dari column.getFacetedUniqueValues(), jadi
// otomatis mengikuti hasil filter kolom lain (search + facet lain).
function FacetSelect({
    label,
    placeholder,
    column,
    options,
}: {
    label: string;
    placeholder: string;
    column: AlihStatusColumn | undefined;
    // Daftar opsi tetap (mis. semua Jenis BMD dari enum). Kalau tidak diisi,
    // opsi diambil dari facetedUniqueValues — nilai yang benar-benar muncul
    // di data yang sedang termuat (mis. daftar Perangkat Daerah Asal).
    options?: { value: string; label: string }[];
}) {
    if (!column) return null;

    const facetedValues = column.getFacetedUniqueValues();
    const selected = ((column.getFilterValue() as string[] | undefined) ?? []) as string[];

    const items =
        options ??
        Array.from(facetedValues.keys())
            .filter((value): value is string => Boolean(value))
            .sort((a, b) => a.localeCompare(b))
            .map((value) => ({ value, label: value }));

    return (
        <Select
            className="w-64"
            placeholder={placeholder}
            selectionMode="multiple"
            value={selected}
            onChange={(value) => {
                const next = value as string[];
                column.setFilterValue(next.length > 0 ? next : undefined);
            }}
        >
            <Label>{label}</Label>
            <Select.Trigger>
                <Select.Value />
                <Select.Indicator />
            </Select.Trigger>
            <Select.Popover>
                <ListBox>
                    {items.map((item) => (
                        <ListBox.Item key={item.value} id={item.value} textValue={item.label}>
                            <Label>{item.label}</Label>
                            <span className="text-muted ml-auto text-xs">
                                {facetedValues.get(item.value) ?? 0}
                            </span>
                            <ListBox.ItemIndicator />
                        </ListBox.Item>
                    ))}
                </ListBox>
            </Select.Popover>
        </Select>
    );
}

export function AlihStatusTableToolbar({ table }: { table: AlihStatusTable }) {
    const [searchInput, setSearchInput] = useState("");
    const debouncedSearch = useDebouncedValue(searchInput, 300);

    useEffect(() => {
        table.setGlobalFilter(debouncedSearch || undefined);
    }, [debouncedSearch, table]);

    return (
        <div className="flex flex-wrap items-end gap-2 pb-3">
            <Input
                aria-label="Cari data alih status"
                className="w-72"
                placeholder="Cari nama barang, NIBAR, nomor, lokasi..."
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
            />
            <FacetSelect
                label="Jenis BMD"
                placeholder="Semua jenis"
                column={table.getColumn("jenisBmd")}
                options={ALIH_STATUS_JENIS_BMD_OPTIONS}
            />
            <FacetSelect
                label="Perangkat Daerah"
                placeholder="Semua perangkat daerah"
                column={table.getColumn("perangkatDaerah")}
            />
        </div>
    );
}