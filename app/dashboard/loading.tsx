"use client";
import { Card, Label, ProgressBar } from "@heroui/react";
import { Coffee, RotateCw, Server, Sparkle } from "lucide-react";
import { useEffect, useRef, useState } from "react";

// Teks jenaka yang berubah berdasarkan persentase progres
const loadingSteps = [
    { max: 20, text: "Menakar biji kopi pilihan barista..." },
    { max: 45, text: "Menggiling data mentah menjadi espresso hangat..." },
    { max: 70, text: "Menyaring ampas bug yang menyumbat server..." },
    { max: 90, text: "Menambahkan sedikit krim visual agar aesthetic..." },
    { max: 100, text: "Kopi hangat siap disajikan! Membuka halaman..." },
];

// Progres simulasi tidak akan pernah melewati batas ini sampai isReady benar-benar true.
// Ini mencegah loading bar "berbohong" mencapai 100% padahal konten belum siap.
const SOFT_CAP = 90;

type LoadingProps = {
    /** true begitu konten/halaman di baliknya benar-benar siap ditampilkan */
    isReady: boolean;
    /** dipanggil setelah animasi keluar selesai — parent bisa melepas Loading dari DOM di sini */
    onFinished?: () => void;
};

export default function Loading({ isReady, onFinished }: LoadingProps) {
    const [progress, setProgress] = useState(0);
    const [statusText, setStatusText] = useState(loadingSteps[0].text);
    const [leaving, setLeaving] = useState(false);
    const finishedRef = useRef(false);

    // Progres berjalan otomatis (terasa "hidup"), tapi mentok di SOFT_CAP selama
    // halaman belum benar-benar siap. Begitu isReady true, progres dibiarkan lanjut ke 100.
    useEffect(() => {
        if (finishedRef.current) return;

        const interval = setInterval(() => {
            setProgress((prev) => {
                const ceiling = isReady ? 100 : SOFT_CAP;
                if (prev >= ceiling) return prev;

                const increment = Math.floor(Math.random() * 10) + 4;
                const next = Math.min(prev + increment, ceiling);

                const activeStep = loadingSteps.find((step) => next <= step.max);
                if (activeStep) setStatusText(activeStep.text);

                return next;
            });
        }, 450);

        return () => clearInterval(interval);
    }, [isReady]);

    // Progres baru bisa menyentuh 100 kalau isReady true. Begitu itu terjadi,
    // tahan sebentar (biar sempat kebaca), lalu fade-out dan beri tahu parent.
    useEffect(() => {
        if (progress < 100 || finishedRef.current) return;
        finishedRef.current = true;

        const holdTimeout = setTimeout(() => {
            setLeaving(true);
            const exitTimeout = setTimeout(() => onFinished?.(), 300);
            return () => clearTimeout(exitTimeout);
        }, 450);

        return () => clearTimeout(holdTimeout);
    }, [progress, onFinished]);

    return (
        // data-theme="dark" men-scope seluruh token warna HeroUI di dalam overlay ini ke
        // varian dark-nya, terlepas dari tema aktif aplikasi — jadi splash screen tetap
        // gelap dan konsisten tanpa perlu hardcode warna manapun.
        <div
            className={`fixed inset-0 z-50 flex flex-col items-center justify-center bg-background p-4 overflow-hidden transition-opacity duration-300 ${leaving ? "pointer-events-none opacity-0" : "opacity-100"
                }`}
        >
            {/* Efek pendaran cahaya (glow) lembut di latar belakang */}
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[300px] h-[300px] bg-accent/10 blur-[100px] rounded-full pointer-events-none" />

            {/* HeroUI v3 Card — dibiarkan pakai warna default komponennya (surface/separator) */}
            <Card className="w-full max-w-sm backdrop-blur-md rounded-2xl shadow-xl">

                {/* Header Card */}
                <Card.Header className="flex flex-col items-center gap-2 pt-8 pb-3">
                    <div className="relative flex items-center justify-center w-16 h-16 rounded-2xl bg-accent-soft text-accent-soft-foreground animate-bounce">
                        <Coffee size={32} strokeWidth={1.5} />
                        <Sparkle size={14} className="absolute top-2 right-2 text-accent animate-pulse" />
                    </div>
                    <Card.Title className="text-lg font-bold text-foreground">
                        Halaman Sedang Dimuat
                    </Card.Title>
                    <Card.Description className="text-xs text-muted text-center px-4">
                        Santai dulu sejenak, server kami sedang butuh asupan kafein.
                    </Card.Description>
                </Card.Header>

                {/* Content Card */}
                <Card.Content className="flex flex-col gap-6 px-6 py-3">

                    {/* HeroUI v3 ProgressBar — warna diatur lewat prop color="accent" */}
                    <ProgressBar aria-label="Loading" value={progress} color="accent" className="w-full gap-2">
                        <div className="flex justify-between text-[11px] text-muted font-medium">
                            <Label>
                                <Server size={11} className="text-muted" />
                                Brewing status...
                            </Label>
                            <ProgressBar.Output />
                        </div>
                        <ProgressBar.Track className="h-1.5 rounded-full bg-surface-tertiary">
                            <ProgressBar.Fill className="rounded-full" />
                        </ProgressBar.Track>
                    </ProgressBar>

                    {/* Kotak teks humoris dinamis */}
                    <div className="flex items-center gap-3 py-3 px-4 rounded-xl bg-surface-secondary border border-separator min-h-[56px]">
                        <RotateCw size={13} className="animate-spin text-accent flex-shrink-0" />
                        <p className="text-xs font-medium text-foreground select-none">
                            {statusText}
                        </p>
                    </div>

                </Card.Content>

                {/* Footer Card */}
                <Card.Footer className="flex justify-center border-t border-separator py-3.5 bg-surface-secondary">
                    <p className="text-[10px] text-muted text-center">
                        ☕ Jangan lupa siapkan kopi hangatmu agar tidak ikut loading!
                    </p>
                </Card.Footer>

            </Card>
        </div>
    );
}