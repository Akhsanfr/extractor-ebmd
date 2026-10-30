"use client";
import { Button, ListBox, SearchField, Select, type Key } from "@heroui/react";
import { FilterX } from "lucide-react";
import { useEffect, useState } from "react";
import { REKON_PIC_OPTIONS, type RekonPic } from "./rekonUtil";
import type { PerangkatDaerahOption } from "./useRekonFilters";

const ALL = "all";
const DEBOUNCE_MS = 300;

export default function RekonFilterBar({
    query,
    onQueryChange,
    perangkatDaerahId,
    onPerangkatDaerahChange,
    pic,
    onPicChange,
    options,
    hasActiveFilter,
    onReset,
}: {
    query: string; // nilai dari URL
    onQueryChange: (q: string) => void;
    perangkatDaerahId: string | null; // nilai dari URL
    onPerangkatDaerahChange: (id: string | null) => void;
    pic: RekonPic | null; // nilai dari URL
    onPicChange: (pic: RekonPic | null) => void;
    options: PerangkatDaerahOption[];
    hasActiveFilter: boolean;
    onReset: () => void;
}) {
    // Input diketik lokal, URL baru diperbarui setelah jeda singkat.
    const [draft, setDraft] = useState(query);

    // URL berubah dari luar (reset, ganti rekonType, buka link) -> input ikut.
    useEffect(() => setDraft(query), [query]);

    useEffect(() => {
        if (draft === query) return;
        const timer = setTimeout(() => onQueryChange(draft), DEBOUNCE_MS);
        return () => clearTimeout(timer);
    }, [draft, query, onQueryChange]);

    const selected =
        perangkatDaerahId && options.some((o) => o.id === perangkatDaerahId) ? perangkatDaerahId : ALL;

    return (
        <div className="mb-4 flex flex-wrap items-center gap-3">
            <SearchField
                className="w-full sm:w-72"
                aria-label="Cari perangkat daerah"
                value={draft}
                onChange={setDraft}
            >
                <SearchField.Group>
                    <SearchField.SearchIcon />
                    <SearchField.Input placeholder="Cari perangkat daerah" />
                    <SearchField.ClearButton />
                </SearchField.Group>
            </SearchField>

            <Select
                className="w-full sm:w-80"
                aria-label="Filter perangkat daerah"
                value={selected}
                onChange={(key: Key | null) =>
                    key && onPerangkatDaerahChange(String(key) === ALL ? null : String(key))
                }
            >
                <Select.Trigger>
                    <Select.Value />
                    <Select.Indicator />
                </Select.Trigger>
                <Select.Popover>
                    <ListBox>
                        <ListBox.Item id={ALL} textValue="Semua perangkat daerah">
                            Semua perangkat daerah
                            <ListBox.ItemIndicator />
                        </ListBox.Item>
                        {options.map((opt) => (
                            <ListBox.Item key={opt.id} id={opt.id} textValue={opt.nama}>
                                {opt.nama}
                                <ListBox.ItemIndicator />
                            </ListBox.Item>
                        ))}
                    </ListBox>
                </Select.Popover>
            </Select>

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

            {hasActiveFilter && (
                <Button variant="ghost" size="sm" onPress={onReset}>
                    <FilterX size={16} />
                    Reset filter
                </Button>
            )}
        </div>
    );
}