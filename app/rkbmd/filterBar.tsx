import { Button, Label, ListBox, Select } from "@heroui/react";
import { X } from "lucide-react";
import { UsulanFilter, UsulanFilterOptions } from "./useVerifiedUsulan";

interface UsulanFilterBarProps {
    filter: UsulanFilter;
    filterOptions: UsulanFilterOptions;
    isFilterActive: boolean;
    totalCount: number;
    filteredCount: number;
    setFilterField: <K extends keyof UsulanFilter>(key: K, value: UsulanFilter[K]) => void;
    resetFilter: () => void;
    onReset?: () => void; // callback tambahan saat reset (misal: clearSelectedKeys)
}

export function UsulanFilterBar({
    filter,
    filterOptions,
    isFilterActive,
    totalCount,
    filteredCount,
    setFilterField,
    resetFilter,
    onReset,
}: UsulanFilterBarProps) {
    const handleReset = () => {
        resetFilter();
        onReset?.();
    };

    return (
        <>
            <div className="flex flex-wrap items-end gap-2">
                {/* Pengguna Barang */}
                <Select
                    className="min-w-[200px] flex-1"
                    value={filter.penggunaBarang || null}
                    onChange={(key) => setFilterField("penggunaBarang", (key as string) ?? "")}
                >
                    <Label>Pengguna Barang</Label>
                    <Select.Trigger>
                        <Select.Value />
                        <Select.Indicator />
                    </Select.Trigger>
                    <Select.Popover>
                        <ListBox>
                            {filterOptions.penggunaBarang.map((v) => (
                                <ListBox.Item key={v} id={v}>
                                    <Label>{v}</Label>
                                    <ListBox.ItemIndicator />
                                </ListBox.Item>
                            ))}
                        </ListBox>
                    </Select.Popover>
                </Select>

                {/* Kuasa Pengguna Barang */}
                <Select
                    className="min-w-[200px] flex-1"
                    isDisabled={filterOptions.kuasaPenggunaBarang.length === 0}
                    value={filter.kuasaPenggunaBarang || null}
                    onChange={(key) => setFilterField("kuasaPenggunaBarang", (key as string) ?? "")}
                >
                    <Label>Kuasa Pengguna Barang</Label>
                    <Select.Trigger>
                        <Select.Value />
                        <Select.Indicator />
                    </Select.Trigger>
                    <Select.Popover>
                        <ListBox>
                            {filterOptions.kuasaPenggunaBarang.map((v) => (
                                <ListBox.Item key={v} id={v}>
                                    <Label>{v}</Label>
                                    <ListBox.ItemIndicator />
                                </ListBox.Item>
                            ))}
                        </ListBox>
                    </Select.Popover>
                </Select>

                {/* Program */}
                <Select
                    className="min-w-[200px] flex-1"
                    isDisabled={filterOptions.program.length === 0}
                    value={filter.program || null}
                    onChange={(key) => setFilterField("program", (key as string) ?? "")}
                >
                    <Label>Program</Label>
                    <Select.Trigger>
                        <Select.Value />
                        <Select.Indicator />
                    </Select.Trigger>
                    <Select.Popover>
                        <ListBox>
                            {filterOptions.program.map((v) => (
                                <ListBox.Item key={v} id={v}>
                                    <Label>{v}</Label>
                                    <ListBox.ItemIndicator />
                                </ListBox.Item>
                            ))}
                        </ListBox>
                    </Select.Popover>
                </Select>

                {/* Kegiatan */}
                <Select
                    className="min-w-[200px] flex-1"
                    isDisabled={!filter.program || filterOptions.kegiatan.length === 0}
                    value={filter.kegiatan || null}
                    onChange={(key) => setFilterField("kegiatan", (key as string) ?? "")}
                >
                    <Label>Kegiatan</Label>
                    <Select.Trigger>
                        <Select.Value />
                        <Select.Indicator />
                    </Select.Trigger>
                    <Select.Popover>
                        <ListBox>
                            {filterOptions.kegiatan.map((v) => (
                                <ListBox.Item key={v} id={v}>
                                    <Label>{v}</Label>
                                    <ListBox.ItemIndicator />
                                </ListBox.Item>
                            ))}
                        </ListBox>
                    </Select.Popover>
                </Select>

                {isFilterActive && (
                    <Button size="sm" variant="ghost" onPress={handleReset}>
                        <X /> Reset Filter
                    </Button>
                )}
            </div>

            {isFilterActive && (
                <p className="text-xs text-muted">
                    Menampilkan <b>{filteredCount}</b> dari <b>{totalCount}</b> data
                    {filter.onlyInvalid && (
                        <span className="text-danger font-medium"> · hanya invalid</span>
                    )}
                </p>
            )}
        </>
    );
}