"use client";
import { useMemo } from "react";
import { Card } from "@heroui/react";
import Decimal from "decimal.js";
import { Landmark, Percent, Scale, Wallet, type LucideIcon } from "lucide-react";
import { getSelisihStatus } from "./rekonStatus";
import { formatPersentase, formatRupiah, type RekonRow } from "./rekonUtil";

type Tone = "accent" | "success" | "warning" | "danger";

const TONE_CLASS: Record<Tone, string> = {
    accent: "bg-accent/10 text-accent",
    success: "bg-success/10 text-success",
    warning: "bg-warning/10 text-warning",
    danger: "bg-danger/10 text-danger",
};

function StatCard({
    icon: Icon,
    label,
    value,
    hint,
    tone,
}: {
    icon: LucideIcon;
    label: string;
    value: string;
    hint?: string;
    tone: Tone;
}) {
    return (
        <Card className= "border border-border transition-all duration-300 hover:-translate-y-0.5 hover:border-accent/60 hover:shadow-lg hover:shadow-accent/10" >
        <Card.Content className="flex flex-row items-center gap-4 p-5" >
            <span
                    className={ `flex size-11 shrink-0 items-center justify-center rounded-2xl ${TONE_CLASS[tone]}` }
                >
        <Icon size={ 20 } />
            </span>
            < div className = "min-w-0" >
                <p className="text-xs uppercase tracking-wider text-muted" > { label } </p>
                    < p className = "truncate text-lg font-semibold tabular-nums" > { value } </p>
    { hint && <p className="text-xs text-muted" > { hint } </p> }
    </div>
        </Card.Content>
        </Card>
    );
}

// Ringkasan seluruh baris pada filter aktif (bukan hanya halaman tabel yang sedang tampil).
export default function RekonSummary({ data }: { data: RekonRow[] | undefined }) {
    const summary = useMemo(() => {
        if (!data) return null;
        const realisasi = data.reduce((acc, r) => acc.plus(r.realisasiAnggaran), new Decimal(0));
        const input = data.reduce((acc, r) => acc.plus(r.inputBMD), new Decimal(0));
        const selisih = realisasi.minus(input);
        const persen = realisasi.isZero() ? null : input.div(realisasi).times(100);
        return { realisasi, input, selisih, persen, status: getSelisihStatus(selisih) };
    }, [data]);

    const dash = "—";

    return (
        <div className= "grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4" >
        <StatCard
                icon={ Wallet }
    label = "Total Realisasi"
    value = { summary? formatRupiah(summary.realisasi) : dash }
    tone = "accent"
        />
        <StatCard
                icon={ Landmark }
    label = "Total Input BMD"
    value = { summary? formatRupiah(summary.input) : dash }
    tone = "success"
        />
        <StatCard
                icon={ Scale }
    label = "Kurang/Lebih"
    value = { summary? formatRupiah(summary.selisih) : dash }
    hint = { summary?.status.label }
    tone = { summary? summary.status.chipColor : "accent"}
        />
        <StatCard
                icon={ Percent }
    label = "Persentase"
    value = { summary? formatPersentase(summary.persen) : dash }
    hint = "Input BMD terhadap realisasi"
    tone = "accent"
        />
        </div>
    );
}