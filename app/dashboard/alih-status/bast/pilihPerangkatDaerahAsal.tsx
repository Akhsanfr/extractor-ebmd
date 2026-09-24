"use client";

import { memo, useMemo } from "react";
import { Button } from "@heroui/react";
import { AlihStatusDataContract } from "@/action/alih-status/data/contract"; // sesuaikan path bila berbeda

type PerangkatDaerahPair = {
    perangkatDaerahAsal: string;
    perangkatDaerahTujuan: string;
};

export default memo(function PilihPerangkatDaerahAsal({
    data,
    selected,
    onSelect,
}: {
    data: AlihStatusDataContract.SelectDTO[];
    selected: PerangkatDaerahPair | null;
    onSelect: (pair: PerangkatDaerahPair) => void;
}) {
    // ambil daftar unik pasangan (Perangkat Daerah Asal, Perangkat Daerah
    // Tujuan) dari data yang dipilih pada step sebelumnya — dedup berdasarkan
    // pasangan, bukan hanya asal saja
    const options = useMemo(() => {
        const map = new Map<string, PerangkatDaerahPair>();
        for (const row of data) {
            if (!row.perangkatDaerahAsal || !row.perangkatDaerahTujuan) continue;
            const key = `${row.perangkatDaerahAsal}|||${row.perangkatDaerahTujuan}`;
            if (!map.has(key)) {
                map.set(key, {
                    perangkatDaerahAsal: row.perangkatDaerahAsal,
                    perangkatDaerahTujuan: row.perangkatDaerahTujuan,
                });
            }
        }
        return Array.from(map.values());
    }, [data]);

    if (options.length === 0) {
        return (
            <p className="text-muted-foreground text-sm">
                Tidak ditemukan pasangan Perangkat Daerah Asal/Tujuan pada data yang dipilih.
            </p>
        );
    }

    return (
        <div className="flex flex-col gap-2">
            <p className="text-sm text-muted-foreground">
                Data yang dipilih berasal dari beberapa pasangan Perangkat Daerah Asal - Tujuan. Pilih salah satu:
            </p>
            {options.map((option) => {
                const isSelected =
                    selected?.perangkatDaerahAsal === option.perangkatDaerahAsal &&
                    selected?.perangkatDaerahTujuan === option.perangkatDaerahTujuan;
                const key = `${option.perangkatDaerahAsal}|||${option.perangkatDaerahTujuan}`;

                return (
                    <Button
                        key={key}
                        type="button"
                        variant={isSelected ? "primary" : "outline"}
                        className="justify-start"
                        onPress={() => onSelect(option)}
                    >
                        {option.perangkatDaerahAsal} → {option.perangkatDaerahTujuan}
                    </Button>
                );
            })}
        </div>
    );
});