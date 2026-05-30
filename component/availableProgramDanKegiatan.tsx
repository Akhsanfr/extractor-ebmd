"use client";

import { useMemo } from "react";
import useSWR from "swr";
import {
    Autocomplete,
    Label,
    ListBox,
    SearchField,
    Description,
    useFilter,
    Spinner,
    EmptyState,
    cn,
} from "@heroui/react";

// ─────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────

export type ProgramKegiatanJson = {
    PROGRAM: string;
    KEGIATAN: string;
};

type ProgramProps = {
    jenis: "program";
    value: string;
    onChange: (val: string) => void;
};

type KegiatanProps = {
    jenis: "kegiatan";
    value: string;
    onChange: (val: string) => void;
    /** Nama program yang sudah dipilih, untuk filter kegiatan */
    parentProgram: string;
};

type AvailableProgramDanKegiatanProps = ProgramProps | KegiatanProps;

// ─────────────────────────────────────────────────────────────
// SWR
// ─────────────────────────────────────────────────────────────

const fetcher = async (url: string) => {
    const res = await fetch(url);
    if (!res.ok) throw new Error("Gagal memuat data program dan kegiatan");
    return res.json() as Promise<ProgramKegiatanJson[]>;
};

function useProgramKegiatanData() {
    return useSWR<ProgramKegiatanJson[]>(
        "/data/program.json",
        fetcher,
        { revalidateOnFocus: false, revalidateOnReconnect: false }
    );
}

// ─────────────────────────────────────────────────────────────
// Component
// ─────────────────────────────────────────────────────────────

export function AvailableProgramDanKegiatan(
    props: AvailableProgramDanKegiatanProps
) {
    const { contains } = useFilter({ sensitivity: "base" });
    const { data = [], error, isLoading } = useProgramKegiatanData();

    const isProgram = props.jenis === "program";
    const parentProgram = !isProgram ? props.parentProgram : "";

    // Deduplicate program, filter kegiatan berdasarkan parent
    const options = useMemo(() => {
        if (isProgram) {
            const seen = new Set<string>();
            return data
                .map((d) => d.PROGRAM)
                .filter((p) => {
                    if (seen.has(p)) return false;
                    seen.add(p);
                    return true;
                });
        }
        return data
            .filter((d) => d.PROGRAM === parentProgram)
            .map((d) => d.KEGIATAN);
    }, [data, isProgram, parentProgram]);

    if (error) {
        return (
            <div className="text-danger text-sm">
                Gagal memuat data program dan kegiatan.
            </div>
        );
    }

    const label = isProgram ? "Program" : "Kegiatan";
    const placeholder = isProgram
        ? "Cari program..."
        : "Cari kegiatan...";

    return (
        <Autocomplete
            selectedKey={props.value || null}
            isDisabled={!isProgram && !parentProgram}
            onSelectionChange={(key) => props.onChange((key as string) ?? "")}
        >
            <Label>{label}</Label>

            <Autocomplete.Trigger>
                <Autocomplete.Value />

                <Spinner
                    size="sm"
                    className={cn(
                        "absolute top-1/2 right-2 -translate-y-1/2",
                        { "pointer-events-none opacity-0": !isLoading }
                    )}
                />

                <Autocomplete.ClearButton />
                <Autocomplete.Indicator />
            </Autocomplete.Trigger>

            {!isProgram && (
                <Description className="text-xs text-muted">
                    Hanya menampilkan kegiatan di bawah program yang dipilih.
                </Description>
            )}

            <Autocomplete.Popover>
                <Autocomplete.Filter filter={contains}>
                    <SearchField>
                        <SearchField.Group>
                            <SearchField.SearchIcon />
                            <SearchField.Input placeholder={placeholder} />
                        </SearchField.Group>
                    </SearchField>

                    <ListBox
                        items={options.map((o) => ({ id: o, label: o }))}
                        renderEmptyState={() => (
                            <EmptyState>
                                {isLoading ? "Memuat data..." : "Tidak ada data"}
                            </EmptyState>
                        )}
                    >
                        {(item) => (
                            <ListBox.Item
                                key={item.id}
                                id={item.id}
                                textValue={item.label}
                            >
                                <Label>{item.label}</Label>
                                <ListBox.ItemIndicator />
                            </ListBox.Item>
                        )}
                    </ListBox>
                </Autocomplete.Filter>
            </Autocomplete.Popover>
        </Autocomplete>
    );
}