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
    cn,
    EmptyState,
} from "@heroui/react";

import {
    JenisPerangkatDaerah,
    PerangkatDaerahJson,
} from "@/types/perangkatDaerah";

// ─────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────

type PenggunaBarangProps = {
    jenis: typeof JenisPerangkatDaerah.penggunaBarang;
    value: string;
    onChange: (val: string) => void;
};

type KuasaPenggunaBarangProps = {
    jenis: typeof JenisPerangkatDaerah.kuasaPenggunaBarang;
    value: string;
    onChange: (val: string) => void;
    parentPenggunaBarang: string;
};

type PerangkatDaerahAutocompleteProps =
    | PenggunaBarangProps
    | KuasaPenggunaBarangProps;

// ─────────────────────────────────────────────────────────────
// SWR
// ─────────────────────────────────────────────────────────────

const fetcher = async (url: string) => {
    const response = await fetch(url);

    if (!response.ok) {
        throw new Error("Gagal memuat data perangkat daerah");
    }

    return response.json() as Promise<PerangkatDaerahJson[]>;
};

function usePerangkatDaerahData() {
    return useSWR<PerangkatDaerahJson[]>(
        "/data/perangkatDaerah.json",
        fetcher,
        {
            revalidateOnFocus: false,
            revalidateOnReconnect: false,
        }
    );
}

// ─────────────────────────────────────────────────────────────
// Component
// ─────────────────────────────────────────────────────────────

export function AvailablePerangkatDaerah(
    props: PerangkatDaerahAutocompleteProps
) {
    const { contains } = useFilter({ sensitivity: "base" });

    const { data = [], error, isLoading } =
        usePerangkatDaerahData();

    const isPengguna =
        props.jenis === JenisPerangkatDaerah.penggunaBarang;

    const parentPenggunaBarang = !isPengguna
        ? props.parentPenggunaBarang
        : "";

    const options = useMemo(() => {
        if (isPengguna) {
            return data.filter(
                (d) =>
                    d.STATUS ===
                    JenisPerangkatDaerah.penggunaBarang
            );
        }

        const parentId =
            data.find(
                (d) => d.LOKASI === parentPenggunaBarang
            )?.ID ?? "";

        return data.filter(
            (d) =>
                d.STATUS ===
                JenisPerangkatDaerah.kuasaPenggunaBarang &&
                d["PARENT ID"] === parentId
        );
    }, [data, isPengguna, parentPenggunaBarang]);

    if (error) {
        return (
            <div className="text-danger text-sm">
                Gagal memuat data perangkat daerah.
            </div>
        );
    }

    return (
        <Autocomplete
            defaultValue={props.value}
            isDisabled={
                !isPengguna && !parentPenggunaBarang
            }
            onChange={(key) =>
                props.onChange(String(key ?? ""))
            }
        >
            <Label>
                {isPengguna
                    ? "Pengguna Barang"
                    : "Kuasa Pengguna Barang"}
            </Label>

            <Autocomplete.Trigger>
                <Autocomplete.Value />

                <Spinner
                    size="sm"
                    className={cn(
                        "absolute top-1/2 right-2 -translate-y-1/2",
                        {
                            "pointer-events-none opacity-0":
                                !isLoading,
                        }
                    )}
                />

                <Autocomplete.ClearButton />
                <Autocomplete.Indicator />
            </Autocomplete.Trigger>

            {!isPengguna && (
                <Description className="text-xs text-muted">
                    Hanya menampilkan unit di bawah pengguna
                    barang yang dipilih.
                </Description>
            )}

            <Autocomplete.Popover>
                <Autocomplete.Filter filter={contains}>
                    <SearchField>
                        <SearchField.Group>
                            <SearchField.SearchIcon />

                            <SearchField.Input
                                placeholder={
                                    isPengguna
                                        ? "Cari pengguna barang..."
                                        : "Cari kuasa pengguna barang..."
                                }
                            />
                        </SearchField.Group>
                    </SearchField>

                    <ListBox
                        items={options}
                        renderEmptyState={() => (
                            <EmptyState>
                                No results found
                            </EmptyState>
                        )}
                    >
                        {(item) => (
                            <ListBox.Item
                                key={item.LOKASI}
                                id={item.LOKASI}
                                textValue={item.LOKASI}
                            >
                                <Label>{item.LOKASI}</Label>

                                <ListBox.ItemIndicator />
                            </ListBox.Item>
                        )}
                    </ListBox>
                </Autocomplete.Filter>
            </Autocomplete.Popover>
        </Autocomplete>
    );
}