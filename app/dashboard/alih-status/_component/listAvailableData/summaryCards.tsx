"use client";

import { Card } from "@heroui/react";
import Decimal from "decimal.js";
import { memo, useMemo } from "react";
import { formatRupiah } from "@/lib/number";
import type { AlihStatusDataContract } from "@/action/alih-status/data/contract";

type Row = AlihStatusDataContract.SelectDTO;

type Summary = {
    totalBmd: number;
    nilaiPerolehan: Decimal;
    akumulasiPenyusutan: Decimal;
    nilaiBuku: Decimal;
};

const toDecimal = (v: unknown) => {
    try {
        return new Decimal((v as Decimal.Value) ?? 0);
    } catch {
        return new Decimal(0);
    }
};

export function summarize(rows: Row[]): Summary {
    let nilaiPerolehan = new Decimal(0);
    let akumulasiPenyusutan = new Decimal(0);
    let nilaiBuku = new Decimal(0);

    for (const row of rows) {
        nilaiPerolehan = nilaiPerolehan.plus(toDecimal(row.nilaiPerolehan));
        akumulasiPenyusutan = akumulasiPenyusutan.plus(toDecimal(row.akumulasiPenyusutan));
        nilaiBuku = nilaiBuku.plus(toDecimal(row.nilaiBuku));
    }

    return {
        totalBmd: rows.length,
        nilaiPerolehan,
        akumulasiPenyusutan,
        nilaiBuku,
    };
}

const SummaryCard = memo(function SummaryCard({
    title,
    value,
}: {
    title: string;
    value: string;
}) {
    return (
        <Card>
            <Card.Header>
                <Card.Description>{title}</Card.Description>
            </Card.Header>
            <Card.Content>
                <Card.Title className="text-xl font-semibold tabular-nums">
                    {value}
                </Card.Title>
            </Card.Content>
        </Card>
    );
});

const SummarySection = memo(function SummarySection({
    label,
    rows,
}: {
    label: string;
    rows: Row[];
}) {
    const s = useMemo(() => summarize(rows), [rows]);

    return (
        <section className="space-y-2">
            <h3 className="text-sm font-semibold text-muted">{label}</h3>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
                <SummaryCard title="Total BMD" value={s.totalBmd.toLocaleString("id-ID")} />
                <SummaryCard
                    title="Total Nilai Perolehan"
                    value={formatRupiah(s.nilaiPerolehan.toNumber())}
                />
                <SummaryCard
                    title="Total Akumulasi Penyusutan"
                    value={formatRupiah(s.akumulasiPenyusutan.toNumber())}
                />
                <SummaryCard
                    title="Total Nilai Buku"
                    value={formatRupiah(s.nilaiBuku.toNumber())}
                />
            </div>
        </section>
    );
});

export const SummaryCards = memo(function SummaryCards({
    allData,
    selectedData,
}: {
    allData: Row[];
    selectedData: Row[];
}) {
    return (
        <div className="space-y-4">
            <SummarySection label="Seluruh Data" rows={allData} />
            <SummarySection
                label={`Data Terpilih (${selectedData.length})`}
                rows={selectedData}
            />
        </div>
    );
});