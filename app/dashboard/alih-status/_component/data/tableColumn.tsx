"use client";

import { AlihStatusDataContract } from "@/action/alih-status/data/contract";
import { BmdAssetType, BmdAssetTypeLabel } from "@/enum/bmd";
import { formatRupiah } from "@/lib/number";
import {
    columnVisibilityFeature,
    createColumnHelper,
    tableFeatures,
    columnSizingFeature,
    rowSortingFeature,
    createSortedRowModel,
    sortFns,
    columnFilteringFeature,
    globalFilteringFeature,
    columnFacetingFeature,
    createFilteredRowModel,
    createFacetedRowModel,
    createFacetedUniqueValues,
    filterFn_includesString,
    type FilterFn,
} from "@tanstack/react-table";
import { TableCellStack } from "./tableCellStack";
import { TableHeaderStack } from "./tableHeaderStack";

// Lebar tetap per kolom (px). Wajib eksplisit agar layout stabil saat virtualisasi.
export const ALIH_STATUS_COL_SIZE = {
    jenisBmd: 120,
    namaBarang: 260,
    nibar: 140,
    merkTipe: 200,
    nomor: 200,
    kondisi: 110,
    lokasi: 220,
    tahun: 80,
    asalUsul: 140,
    jumlah: 90,
    nilai: 200,
    perangkatDaerah: 260,
} as const;

// Lebar kolom aksi (bodyAction) di luar definisi kolom TanStack.
export const ALIH_STATUS_ACTION_COL_SIZE = 96;

// Grouping & subtotal tetap ditangani manual di tableData.tsx (lihat catatan
// di sana) — row model di bawah ini hanya untuk sorting, column filtering
// (facet "jenisBmd" & "perangkatDaerah"), dan global filter (search).
export const alihStatusTableFeatures = tableFeatures({
    columnVisibilityFeature,
    columnSizingFeature,
    rowSortingFeature,
    columnFilteringFeature,
    globalFilteringFeature,
    columnFacetingFeature,
    sortedRowModel: createSortedRowModel(),
    filteredRowModel: createFilteredRowModel(),
    facetedRowModel: createFacetedRowModel(),
    facetedUniqueValues: createFacetedUniqueValues(),
    sortFns,
});

// Opsi tetap untuk facet "Jenis BMD" — dari enum, bukan dari data, supaya
// semua jenis tetap muncul di dropdown walau belum ada barisnya di halaman
// data yang sedang ditampilkan.
export const ALIH_STATUS_JENIS_BMD_OPTIONS = Object.entries(BmdAssetType).map(([value, label]) => ({
    value: value as keyof typeof BmdAssetType,
    label,
}));

// Filter untuk facet multi-select (Jenis BMD, Perangkat Daerah): filterValue
// adalah array pilihan user, sedangkan nilai kolomnya sendiri scalar (bukan
// array). PENTING: jangan pakai filterFn bawaan "arrIncludesSome" di sini —
// itu ditujukan untuk kolom yang NILAINYA SENDIRI berupa array (mis. tags),
// bukan untuk kasus "scalar column vs array of selected options". Kalau
// dipaksakan, semua baris langsung dianggap tidak cocok begitu satu opsi
// saja dipilih (karena nilai kolom bukan array), dan tabel keliatan kosong.
const filterFnSelectedIncludesValue: FilterFn<
    typeof alihStatusTableFeatures,
    AlihStatusDataContract.SelectDTO
> = (row, columnId, filterValue) => {
    if (!Array.isArray(filterValue) || filterValue.length === 0) return true;
    const value = row.getValue(columnId);
    return value != null && filterValue.includes(value);
};

export const alihStatusColumnHelper = createColumnHelper<
    typeof alihStatusTableFeatures,
    AlihStatusDataContract.SelectDTO
>();

export const alihStatusColumns = alihStatusColumnHelper.columns([
    alihStatusColumnHelper.accessor("assetType", {
        id: "jenisBmd",
        size: ALIH_STATUS_COL_SIZE.jenisBmd,
        header: () => <TableHeaderStack columns={["Jenis BMD"]} />,
        cell: ({ row }) => (
            <TableCellStack
                columns={[row.original.assetType ? BmdAssetTypeLabel[row.original.assetType] : "-"]}
            />
        ),
        // Facet multi-select: filter value-nya array of assetType.
        filterFn: filterFnSelectedIncludesValue,
        enableGlobalFilter: false,
    }),
    alihStatusColumnHelper.display({
        id: "namaBarang",
        size: ALIH_STATUS_COL_SIZE.namaBarang,
        header: () => <TableHeaderStack columns={["Nama Barang", "Kode Barang"]} />,
        cell: ({ row }) => (
            <TableCellStack columns={[row.original.namaBarangKategori, row.original.kodeBarang]} />
        ),
    }),
    alihStatusColumnHelper.display({
        id: "nibar",
        size: ALIH_STATUS_COL_SIZE.nibar,
        header: () => <TableHeaderStack columns={["NIBAR", "Register"]} />,
        cell: ({ row }) => <TableCellStack columns={[row.original.nibar, row.original.kodeRegister]} />,
    }),
    alihStatusColumnHelper.display({
        id: "merkTipe",
        size: ALIH_STATUS_COL_SIZE.merkTipe,
        header: () => <TableHeaderStack columns={["Merk / Tipe"]} />,
        cell: ({ row }) => <TableCellStack columns={[row.original.merkTipe]} />,
    }),
    alihStatusColumnHelper.display({
        id: "nomor",
        size: ALIH_STATUS_COL_SIZE.nomor,
        header: () => <TableHeaderStack columns={["Nomor Polisi", "Nomor Rangka", "Nomor Mesin"]} />,
        cell: ({ row }) => (
            <TableCellStack
                columns={[row.original.nomorPolisi, row.original.nomorRangka, row.original.nomorMesin]}
            />
        ),
    }),
    alihStatusColumnHelper.display({
        id: "kondisi",
        size: ALIH_STATUS_COL_SIZE.kondisi,
        header: () => <TableHeaderStack columns={["Kondisi"]} />,
        cell: ({ row }) => <TableCellStack columns={[row.original.kondisi]} />,
    }),
    alihStatusColumnHelper.display({
        id: "lokasi",
        size: ALIH_STATUS_COL_SIZE.lokasi,
        header: () => <TableHeaderStack columns={["Lokasi"]} />,
        cell: ({ row }) => <TableCellStack columns={[row.original.lokasi]} />,
    }),
    alihStatusColumnHelper.display({
        id: "tahun",
        size: ALIH_STATUS_COL_SIZE.tahun,
        header: () => <TableHeaderStack columns={["Tahun"]} />,
        cell: ({ row }) => <TableCellStack columns={[row.original.tahun]} />,
    }),
    alihStatusColumnHelper.display({
        id: "asalUsul",
        size: ALIH_STATUS_COL_SIZE.asalUsul,
        header: () => <TableHeaderStack columns={["Asal Usul"]} />,
        cell: ({ row }) => <TableCellStack columns={[row.original.asalUsul]} />,
    }),
    alihStatusColumnHelper.accessor("jumlah", {
        id: "jumlah",
        size: ALIH_STATUS_COL_SIZE.jumlah,
        header: () => <TableHeaderStack columns={["Jumlah", "Luas"]} />,
        cell: ({ getValue, row }) => <TableCellStack columns={[getValue(), row.original.luas && `${row.original.luas} m²`]} />,
    }),
    alihStatusColumnHelper.display({
        id: "nilai",
        size: ALIH_STATUS_COL_SIZE.nilai,
        header: () => (
            <TableHeaderStack
                align="right"
                columns={["Nilai Perolehan", "Akumulasi Penyusutan", "Nilai Buku"]}
            />
        ),
        cell: ({ row }) => (
            <TableCellStack
                align="right"
                columns={[
                    formatRupiah(row.original.nilaiPerolehan),
                    formatRupiah(row.original.akumulasiPenyusutan),
                    formatRupiah(row.original.nilaiBuku),
                ]}
            />
        ),
    }),
    alihStatusColumnHelper.accessor("perangkatDaerahAsal", {
        id: "perangkatDaerah",
        size: ALIH_STATUS_COL_SIZE.perangkatDaerah,
        header: () => <TableHeaderStack columns={["Perangkat Daerah Asal", "Perangkat Daerah Tujuan"]} />,
        cell: ({ row }) => (
            <TableCellStack columns={[row.original.perangkatDaerahAsal, row.original.perangkatDaerahTujuan]} />
        ),
        // Facet berdasarkan Perangkat Daerah Asal. Kalau nanti butuh facet
        // Tujuan juga, duplikasi kolom ini dengan accessor
        // "perangkatDaerahTujuan" dan id lain, misalnya "perangkatDaerahTujuan".
        filterFn: filterFnSelectedIncludesValue,
        enableGlobalFilter: false,
    }),
    // Kolom tersembunyi khusus untuk search box (global filter). Digabung
    // jadi satu string supaya pencarian mencakup semua kolom teks sekaligus,
    // tanpa perlu bikin tiap kolom display jadi accessor. Disembunyikan lewat
    // initialState.columnVisibility di tableData.tsx.
    alihStatusColumnHelper.accessor(
        (row) =>
            [
                row.namaBarangKategori,
                row.kodeBarang,
                row.nibar,
                row.kodeRegister,
                row.merkTipe,
                row.nomorPolisi,
                row.nomorRangka,
                row.nomorMesin,
                row.kondisi,
                row.lokasi,
                row.asalUsul,
                row.perangkatDaerahAsal,
                row.perangkatDaerahTujuan,
            ]
                .filter(Boolean)
                .join(" "),
        {
            id: "search",
            header: () => null,
            cell: () => null,
            enableColumnFilter: false,
            enableSorting: false,
            enableGlobalFilter: true,
            filterFn: filterFn_includesString,
        },
    ),
]);