"use client";

import { AlihStatusDataContract } from "@/action/alih-status/data/contract";
import { formatRupiah, sumDecimal } from "@/lib/number";
import { Table } from "@heroui/react";
import { ReactNode, useCallback, useMemo, useRef } from "react";
import { flexRender, useTable } from "@tanstack/react-table";
import type { Row } from "@tanstack/react-table";
import {
    ALIH_STATUS_ACTION_COL_SIZE,
    alihStatusColumns,
    alihStatusTableFeatures,
} from "./tableColumn";
import { useVirtualizer } from "@tanstack/react-virtual";
import { AlihStatusTableToolbar } from "./tableToolbar";

type AlihStatusRow = Row<typeof alihStatusTableFeatures, AlihStatusDataContract.SelectDTO>;

type AlihStatusGroup = {
    key: string;
    perangkatDaerahAsal: AlihStatusDataContract.SelectDTO["perangkatDaerahAsal"];
    perangkatDaerahTujuan: AlihStatusDataContract.SelectDTO["perangkatDaerahTujuan"];
    rows: AlihStatusRow[];
};

// Mengelompokkan `Row` TanStack (bukan raw data) supaya bisa langsung
// dipakai untuk render cell via flexRender.
export function groupRowsByPerangkatDaerah(rows: AlihStatusRow[]): AlihStatusGroup[] {
    const map = new Map<string, AlihStatusGroup>();

    for (const row of rows) {
        const item = row.original;
        const key = `${item.perangkatDaerahAsal ?? ""}__${item.perangkatDaerahTujuan ?? ""}`;

        if (!map.has(key)) {
            map.set(key, {
                key,
                perangkatDaerahAsal: item.perangkatDaerahAsal,
                perangkatDaerahTujuan: item.perangkatDaerahTujuan,
                rows: [],
            });
        }

        map.get(key)!.rows.push(row);
    }

    return Array.from(map.values());
}

type Totals = {
    jumlah: number;
    nilaiPerolehan: number;
    akumulasiPenyusutan: number;
    nilaiBuku: number;
};

type VirtualEntry =
    | { type: "row"; row: AlihStatusRow }
    | ({
        type: "subtotal";
        key: string;
        perangkatDaerahAsal: string;
        perangkatDaerahTujuan: string;
    } & Totals)
    | ({ type: "total" } & Totals);

function sumTotals(items: AlihStatusDataContract.SelectDTO[]): Totals {
    return {
        jumlah: sumDecimal(items.map((d) => d.jumlah)),
        nilaiPerolehan: sumDecimal(items.map((d) => d.nilaiPerolehan)),
        akumulasiPenyusutan: sumDecimal(items.map((d) => d.akumulasiPenyusutan)),
        nilaiBuku: sumDecimal(items.map((d) => d.nilaiBuku)),
    };
}

// Perkiraan tinggi awal (px). Tinggi asli tetap diukur lewat measureElement.
// Baris data & subtotal sama-sama punya 3 baris teks bertumpuk (kolom nomor / nilai).
const ESTIMATE_ROW_HEIGHT = 68;
const ESTIMATE_SUMMARY_HEIGHT = 72;

export function AlihStatusTabelData({
    isLoading,
    data,
    headerAction,
    bodyAction,
}: {
    isLoading: boolean,
    data: AlihStatusDataContract.SelectDTO[];
    headerAction?: ReactNode;
    bodyAction?: ({ item }: { item: AlihStatusDataContract.SelectDTO }) => ReactNode;
}) {
    const tableContainerRef = useRef<HTMLDivElement>(null);

    const table = useTable({
        features: alihStatusTableFeatures,
        columns: alihStatusColumns,
        data,
        getRowId: (row) => String(row.id),
        // Kolom "search" cuma dipakai sebagai sumber global filter, tidak
        // pernah dirender — sembunyikan dari header & cell.
        initialState: { columnVisibility: { search: false } },
    });

    const rows = table.getRowModel().rows;
    // Filter eksplisit ke kolom yang visible saja — getFlatHeaders() bisa
    // ikut mengembalikan header untuk kolom yang disembunyikan tergantung
    // versi TanStack Table, dan itu akan mengacaukan labelColSpan/columnCount.
    const headers = table.getFlatHeaders().filter((header) => header.column.getIsVisible());

    // Semua kolom sebelum "jumlah" digabung untuk label subtotal/total.
    const labelColSpan = useMemo(
        () => Math.max(headers.findIndex((h) => h.column.id === "jumlah"), 1),
        [headers],
    );

    const columnCount = useMemo(
        () => headers.length + (bodyAction ? 1 : 0),
        [headers, bodyAction],
    );
    const tableWidth = useMemo(
        () => table.getTotalSize() + (bodyAction ? ALIH_STATUS_ACTION_COL_SIZE : 0),
        [table, headers, bodyAction],
    );

    // 1. Ratakan groups (data rows + subtotal + total) jadi satu array flat
    const flatVirtualRows = useMemo<VirtualEntry[]>(() => {
        const groups = groupRowsByPerangkatDaerah(rows);
        const result: VirtualEntry[] = [];

        for (const group of groups) {
            for (const row of group.rows) {
                result.push({ type: "row", row });
            }

            result.push({
                type: "subtotal",
                key: `subtotal-${group.key}`,
                perangkatDaerahAsal: group.perangkatDaerahAsal ?? "#",
                perangkatDaerahTujuan: group.perangkatDaerahTujuan ?? "#",
                ...sumTotals(group.rows.map((r) => r.original)),
            });
        }

        result.push({ type: "total", ...sumTotals(rows.map((r) => r.original)) });

        return result;
    }, [rows]);

    // 2. Virtualizer bekerja di atas array flat, bukan di atas `rows` mentah
    //
    // estimateSize / getItemKey / getScrollElement di-useCallback supaya
    // identitas fungsinya stabil antar render. Tanpa ini, tiap scroll tick
    // (yang men-trigger re-render lewat state internal virtualizer) membuat
    // object options baru → kerja ekstra yang tidak perlu untuk virtualizer,
    // dan salah satu penyebab utama lag saat scroll.
    const getScrollElement = useCallback(() => tableContainerRef.current, []);

    const estimateSize = useCallback(
        (index: number) =>
            flatVirtualRows[index]?.type === "row" ? ESTIMATE_ROW_HEIGHT : ESTIMATE_SUMMARY_HEIGHT,
        [flatVirtualRows],
    );

    const getItemKey = useCallback(
        (index: number) => {
            const item = flatVirtualRows[index];
            if (item.type === "row") return item.row.id;
            if (item.type === "subtotal") return item.key;
            return "total-row";
        },
        [flatVirtualRows],
    );

    const rowVirtualizer = useVirtualizer({
        count: flatVirtualRows.length,
        getScrollElement,
        estimateSize,
        overscan: 8,
        getItemKey,
    });

    const virtualItems = rowVirtualizer.getVirtualItems();
    const paddingTop = virtualItems.length > 0 ? virtualItems[0].start : 0;
    const paddingBottom =
        virtualItems.length > 0
            ? rowVirtualizer.getTotalSize() - virtualItems[virtualItems.length - 1].end
            : 0;

    return (
        <div className="flex flex-col">
            <AlihStatusTableToolbar table={table} />
            <Table aria-label="Tabel data alih status">
                <Table.ScrollContainer ref={tableContainerRef} className="max-h-[800] overflow-auto">
                    <Table.Content
                        aria-label="Tabel data alih status"
                        // Kunci stabilitas: lebar kolom ditentukan dari header, bukan dari
                        // konten baris yang kebetulan sedang dirender.
                        style={{ tableLayout: "fixed", width: tableWidth, minWidth: tableWidth }}
                    >
                        <Table.Header className="sticky top-0 z-10">
                            {headers.map((header) => (
                                <Table.Column
                                    key={header.id}
                                    isRowHeader={header.column.id === "jenisBmd"}
                                    style={{ width: header.getSize() }}
                                >
                                    {header.isPlaceholder
                                        ? null
                                        : flexRender(header.column.columnDef.header, header.getContext())}
                                </Table.Column>
                            ))}
                            {headerAction}
                        </Table.Header>

                        <Table.Body>
                            {paddingTop > 0 && (
                                <Table.Row>
                                    <Table.Cell
                                        colSpan={columnCount}
                                        style={{ height: paddingTop, padding: 0, border: 0 }}
                                    />
                                </Table.Row>
                            )}

                            {virtualItems.map((virtualRow) => {
                                const item = flatVirtualRows[virtualRow.index];

                                if (item.type === "row") {
                                    return (
                                        <Table.Row
                                            key={virtualRow.key}
                                            data-index={virtualRow.index}
                                            ref={rowVirtualizer.measureElement}
                                        >
                                            {item.row.getVisibleCells().map((cell) => (
                                                <Table.Cell key={cell.id}>
                                                    {flexRender(cell.column.columnDef.cell, cell.getContext())}
                                                </Table.Cell>
                                            ))}
                                            {bodyAction && bodyAction({ item: item.row.original })}
                                        </Table.Row>
                                    );
                                }

                                const isTotal = item.type === "total";
                                const weight = isTotal ? "font-bold" : "font-semibold";

                                return (
                                    <Table.Row
                                        key={virtualRow.key}
                                        data-index={virtualRow.index}
                                        ref={rowVirtualizer.measureElement}
                                        className={`${weight} ${isTotal ? "bg-default-100" : "bg-default-50"}`}
                                    >
                                        <Table.Cell colSpan={labelColSpan}>
                                            <span className={weight}>
                                                {isTotal
                                                    ? "Total"
                                                    : `Subtotal — ${item.perangkatDaerahAsal} → ${item.perangkatDaerahTujuan}`}
                                            </span>
                                        </Table.Cell>
                                        <Table.Cell>
                                            <span className={weight}>{item.jumlah}</span>
                                        </Table.Cell>
                                        <Table.Cell>
                                            <div className={`flex flex-col items-end text-right ${weight}`}>
                                                <span>{formatRupiah(item.nilaiPerolehan)}</span>
                                                <span>{formatRupiah(item.akumulasiPenyusutan)}</span>
                                                <span>{formatRupiah(item.nilaiBuku)}</span>
                                            </div>
                                        </Table.Cell>
                                        <Table.Cell />
                                        {bodyAction && <Table.Cell />}
                                    </Table.Row>
                                );
                            })}

                            {paddingBottom > 0 && (
                                <Table.Row>
                                    <Table.Cell
                                        colSpan={columnCount}
                                        style={{ height: paddingBottom, padding: 0, border: 0 }}
                                    />
                                </Table.Row>
                            )}
                        </Table.Body>
                    </Table.Content>
                </Table.ScrollContainer>
            </Table>
        </div>
    );
}