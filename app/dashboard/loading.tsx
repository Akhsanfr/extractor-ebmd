"use client";

import { Card, Label, ProgressBar } from "@heroui/react";
import { Building2, Coffee, RotateCw, Server } from "lucide-react";
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
    const rootRef = useRef<HTMLDivElement>(null);

    // Simpan onFinished di ref supaya perubahan identitas callback dari parent
    // tidak membatalkan timeout keluar (yang membuat overlay macet di 100%).
    const onFinishedRef = useRef(onFinished);
    useEffect(() => {
        onFinishedRef.current = onFinished;
    }, [onFinished]);

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
            setTimeout(() => onFinishedRef.current?.(), 300);
        }, 450);

        return () => clearTimeout(holdTimeout);
    }, [progress]);

    const onMove = (e: React.MouseEvent) => {
        const el = rootRef.current;
        if (!el) return;
        const r = el.getBoundingClientRect();
        el.style.setProperty("--mx", `${e.clientX - r.left}px`);
        el.style.setProperty("--my", `${e.clientY - r.top}px`);
    };

    return (
        // Warna mengikuti token HeroUI dan tema aktif aplikasi, sama seperti landing page & halaman login.
        <div
            ref={rootRef}
            onMouseMove={onMove}
            style={{ ["--mx" as string]: "50%", ["--my" as string]: "45%" }}
            className={`fixed inset-0 z-50 flex h-screen w-screen flex-col items-center justify-center overflow-hidden bg-background p-4 text-foreground transition-opacity duration-300 ${leaving ? "pointer-events-none opacity-0" : "opacity-100"
                }`}
        >
            <style>{`
        @keyframes float { 0%,100% { transform: translateY(0) } 50% { transform: translateY(-14px) } }
        @keyframes rise { from { opacity: 0; transform: translateY(16px) } to { opacity: 1; transform: none } }
        @keyframes sheen { from { transform: translateX(-100%) } to { transform: translateX(100%) } }
        .animate-float { animation: float 6s ease-in-out infinite }
        .animate-float-slow { animation: float 9s ease-in-out infinite }
        .animate-float-fast { animation: float 2.4s ease-in-out infinite }
        .animate-rise { animation: rise .6s ease-out both }
        .animate-sheen { animation: sheen 1.8s ease-in-out infinite }
        @media (prefers-reduced-motion: reduce) {
          .animate-float, .animate-float-slow, .animate-float-fast, .animate-rise, .animate-sheen { animation: none }
        }
      `}</style>

            {/* grid */}
            <div
                aria-hidden
                className="absolute inset-0 opacity-[0.35]"
                style={{
                    backgroundImage:
                        "linear-gradient(to right, var(--border) 1px, transparent 1px), linear-gradient(to bottom, var(--border) 1px, transparent 1px)",
                    backgroundSize: "56px 56px",
                    maskImage:
                        "radial-gradient(ellipse at center, black 30%, transparent 75%)",
                    WebkitMaskImage:
                        "radial-gradient(ellipse at center, black 30%, transparent 75%)",
                }}
            />
            {/* mouse spotlight */}
            <div
                aria-hidden
                className="pointer-events-none absolute inset-0"
                style={{
                    background:
                        "radial-gradient(520px circle at var(--mx) var(--my), color-mix(in oklab, var(--accent) 22%, transparent), transparent 65%)",
                }}
            />
            {/* blobs */}
            <div
                aria-hidden
                className="animate-float pointer-events-none absolute -left-24 top-24 size-80 rounded-full bg-accent/20 blur-3xl"
            />
            <div
                aria-hidden
                className="animate-float-slow pointer-events-none absolute -right-20 bottom-10 size-96 rounded-full bg-success/15 blur-3xl"
            />

            <Card className="animate-rise relative w-full max-w-sm rounded-2xl border border-border shadow-2xl shadow-accent/10 backdrop-blur-md">
                {/* Header Card */}
                <Card.Header className="flex flex-col items-center gap-2 pb-3 pt-8">
                    <div className="animate-float-fast relative flex size-16 items-center justify-center rounded-2xl bg-accent text-accent-foreground shadow-lg shadow-accent/30">
                        <Building2 size={30} strokeWidth={1.6} />
                        <span className="absolute -bottom-2 -right-2 flex size-7 items-center justify-center rounded-full border border-border bg-surface text-accent shadow-md">
                            <Coffee size={14} />
                        </span>
                    </div>

                    <p className="mt-2 bg-gradient-to-r from-accent to-success bg-clip-text text-xl font-bold tracking-tight text-transparent">
                        SI PANDU
                    </p>
                    <Card.Title className="text-base font-semibold text-foreground">
                        Halaman Sedang Dimuat
                    </Card.Title>
                    <Card.Description className="px-4 text-center text-xs text-muted">
                        Santai dulu sejenak, server kami sedang butuh asupan kafein.
                    </Card.Description>
                </Card.Header>

                {/* Content Card */}
                <Card.Content className="flex flex-col gap-6 px-6 py-3">
                    <ProgressBar
                        aria-label="Loading"
                        value={progress}
                        color="accent"
                        className="w-full gap-2"
                    >
                        <div className="flex justify-between text-[11px] font-medium text-muted">
                            <Label className="flex items-center gap-1.5">
                                <Server size={11} className="text-accent" />
                                Brewing status...
                            </Label>
                            <ProgressBar.Output />
                        </div>
                        <ProgressBar.Track className="relative h-1.5 overflow-hidden rounded-full bg-surface-tertiary">
                            <ProgressBar.Fill className="rounded-full bg-gradient-to-r from-accent to-success" />
                            {/* kilau bergerak di atas track */}
                            <span
                                aria-hidden
                                className="animate-sheen absolute inset-y-0 w-1/3 bg-gradient-to-r from-transparent via-white/40 to-transparent"
                            />
                        </ProgressBar.Track>
                    </ProgressBar>

                    {/* Kotak teks humoris dinamis */}
                    <div className="group flex min-h-[56px] items-center gap-3 rounded-xl border border-separator bg-surface-secondary px-4 py-3 transition-colors duration-300 hover:border-accent">
                        <RotateCw
                            size={13}
                            className="shrink-0 animate-spin text-accent"
                        />
                        <p
                            key={statusText}
                            className="animate-rise select-none text-xs font-medium text-foreground"
                        >
                            {statusText}
                        </p>
                    </div>
                </Card.Content>

                {/* Footer Card */}
                <Card.Footer className="flex justify-center border-t border-separator bg-surface-secondary py-3.5">
                    <p className="text-center text-[10px] text-muted">
                        ☕ Jangan lupa siapkan kopi hangatmu agar tidak ikut loading!
                    </p>
                </Card.Footer>
            </Card>
        </div>
    );
}