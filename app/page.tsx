"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";
import { Accordion, Button, Card, Chip, Tabs } from "@heroui/react";
import {
    ArrowRight,
    ArrowUpRight,
    BarChart3,
    Building2,
    ClipboardCheck,
    DatabaseZap,
    FileSpreadsheet,
    FileText,
    History,
    Map,
    Moon,
    Repeat,
    ScrollText,
    ShieldCheck,
    Sparkles,
    Sun,
    Trash2,
    Wallet,
    type LucideIcon,
} from "lucide-react";

/* -------------------------------------------------------------------------- */
/*  Data                                                                      */
/* -------------------------------------------------------------------------- */

type Feature = {
    icon: LucideIcon;
    title: string;
    desc: string;
    tag: string;
};

const FEATURES: Feature[] = [
    {
        icon: DatabaseZap,
        title: "Replikasi Database eBMD",
        desc: "Sinkronisasi data aset dari eBMD ke database lokal secara terjadwal, siap dipakai tanpa bergantung koneksi ke sumber.",
        tag: "Integrasi",
    },
    {
        icon: Wallet,
        title: "Modul RKBMD",
        desc: "Penyusunan rencana kebutuhan dan pemeliharaan BMD per perangkat daerah, dari usulan sampai rekapitulasi.",
        tag: "Perencanaan",
    },
    {
        icon: ClipboardCheck,
        title: "Modul Penggunaan",
        desc: "Pengelolaan penetapan status penggunaan BMD dengan alur pengajuan, verifikasi, dan persetujuan.",
        tag: "Pengelolaan",
    },
    {
        icon: Map,
        title: "Sebaran BMD Geospasial",
        desc: "Lihat sebaran aset di atas peta interaktif berbasis data spasial untuk analisis lokasi dan cakupan.",
        tag: "Geospasial",
    },
    {
        icon: Repeat,
        title: "Alih Status",
        desc: "Pencatatan dan pelacakan proses alih status penggunaan beserta dokumen pendukungnya.",
        tag: "Pengelolaan",
    },
    {
        icon: FileSpreadsheet,
        title: "Import & Export Excel",
        desc: "Unggah data massal dan ekspor laporan ke Excel dengan validasi agar data tetap bersih.",
        tag: "Produktivitas",
    },
    {
        icon: Building2,
        title: "Inventarisasi Aset",
        desc: "Daftar aset tanah, gedung, dan peralatan lengkap dengan pencarian cepat dan filter bertingkat.",
        tag: "Data Aset",
    },
    {
        icon: Trash2,
        title: "Penghapusan & Pemindahtanganan",
        desc: "Kelola usulan penghapusan dan pemindahtanganan BMD dengan status yang terlacak jelas.",
        tag: "Pengelolaan",
    },
    {
        icon: BarChart3,
        title: "Dashboard & Pelaporan",
        desc: "Ringkasan kondisi BMD dalam grafik dan tabel, siap dicetak untuk kebutuhan pelaporan.",
        tag: "Analitik",
    },
    {
        icon: ShieldCheck,
        title: "Hak Akses Berjenjang",
        desc: "Peran pengguna terpisah untuk admin, pengelola barang, dan operator perangkat daerah.",
        tag: "Keamanan",
    },
    {
        icon: History,
        title: "Jejak Audit",
        desc: "Setiap perubahan data tercatat: siapa, kapan, dan apa yang diubah.",
        tag: "Keamanan",
    },
    {
        icon: ScrollText,
        title: "Dan Masih Banyak Lagi",
        desc: "Modul terus dikembangkan mengikuti kebutuhan pengelolaan BMD di lapangan.",
        tag: "Roadmap",
    },
];

const MODULES = [
    {
        id: "ebmd",
        label: "Replikasi eBMD",
        icon: DatabaseZap,
        title: "Data eBMD, selalu tersedia di tangan Anda",
        points: [
            "Sinkronisasi terjadwal dan manual dari eBMD",
            "Log setiap proses replikasi beserta statusnya",
            "Data lokal siap diolah untuk modul lain",
        ],
        stats: [
            { k: "Sumber", v: "eBMD" },
            { k: "Mode", v: "Terjadwal" },
            { k: "Log", v: "Lengkap" },
        ],
    },
    {
        id: "rkbmd",
        label: "RKBMD",
        icon: Wallet,
        title: "Perencanaan kebutuhan yang lebih terarah",
        points: [
            "Usulan kebutuhan dan pemeliharaan per perangkat daerah",
            "Rekapitulasi otomatis untuk bahan penganggaran",
            "Status verifikasi yang terlihat oleh semua pihak",
        ],
        stats: [
            { k: "Alur", v: "Usul → Verif" },
            { k: "Rekap", v: "Otomatis" },
            { k: "Ekspor", v: "Excel" },
        ],
    },
    {
        id: "penggunaan",
        label: "Penggunaan",
        icon: ClipboardCheck,
        title: "Penetapan status penggunaan tanpa tumpukan berkas",
        points: [
            "Pengajuan dan persetujuan dalam satu alur",
            "Dokumen pendukung terlampir bersama usulan",
            "Riwayat status mudah ditelusuri",
        ],
        stats: [
            { k: "Alur", v: "Ajukan → Setuju" },
            { k: "Dokumen", v: "Terlampir" },
            { k: "Riwayat", v: "Terlacak" },
        ],
    },
];

const FAQ = [
    {
        q: "Apa itu SI PANDU?",
        a: "SI PANDU adalah Sistem Pendukung Pengelolaan BMD Terpadu, aplikasi yang membantu pengelola barang dan perangkat daerah mengelola Barang Milik Daerah dalam satu tempat.",
    },
    {
        q: "Bagaimana hubungan SI PANDU dengan eBMD?",
        a: "SI PANDU mereplikasi data eBMD ke database lokal sehingga data dapat diolah lebih leluasa di modul perencanaan, penggunaan, dan pelaporan.",
    },
    {
        q: "Siapa saja yang bisa memakai aplikasi ini?",
        a: "Admin, pengelola barang, dan operator perangkat daerah, masing-masing dengan hak akses yang sesuai peran.",
    },
    {
        q: "Apakah data saya aman?",
        a: "Akses dibatasi berdasarkan peran dan setiap perubahan data dicatat dalam jejak audit.",
    },
];

/* -------------------------------------------------------------------------- */
/*  Small helpers                                                             */
/* -------------------------------------------------------------------------- */

function Reveal({
    children,
    delay = 0,
    className = "",
}: {
    children: ReactNode;
    delay?: number;
    className?: string;
}) {
    const ref = useRef<HTMLDivElement>(null);
    const [shown, setShown] = useState(false);

    useEffect(() => {
        const el = ref.current;
        if (!el) return;
        const io = new IntersectionObserver(
            ([entry]) => {
                if (entry.isIntersecting) {
                    setShown(true);
                    io.disconnect();
                }
            },
            { threshold: 0.15 },
        );
        io.observe(el);
        return () => io.disconnect();
    }, []);

    return (
        <div
            ref={ref}
            style={{ transitionDelay: `${delay}ms` }}
            className={`transition-all duration-700 ease-out ${shown ? "translate-y-0 opacity-100" : "translate-y-8 opacity-0"
                } ${className}`}
        >
            {children}
        </div>
    );
}

function CountUp({ to, suffix = "" }: { to: number; suffix?: string }) {
    const ref = useRef<HTMLSpanElement>(null);
    const [value, setValue] = useState(0);

    useEffect(() => {
        const el = ref.current;
        if (!el) return;
        const io = new IntersectionObserver(([entry]) => {
            if (!entry.isIntersecting) return;
            io.disconnect();
            const start = performance.now();
            const duration = 1400;
            const tick = (now: number) => {
                const p = Math.min((now - start) / duration, 1);
                setValue(Math.round(to * (1 - Math.pow(1 - p, 3))));
                if (p < 1) requestAnimationFrame(tick);
            };
            requestAnimationFrame(tick);
        });
        io.observe(el);
        return () => io.disconnect();
    }, [to]);

    return (
        <span ref={ref}>
            {value.toLocaleString("id-ID")}
            {suffix}
        </span>
    );
}

function ThemeToggle() {
    const [dark, setDark] = useState(false);

    useEffect(() => {
        setDark(document.documentElement.classList.contains("dark"));
    }, []);

    const toggle = () => {
        const next = !dark;
        setDark(next);
        const root = document.documentElement;
        root.classList.toggle("dark", next);
        root.classList.toggle("light", !next);
        root.setAttribute("data-theme", next ? "dark" : "light");
    };

    return (
        <Button
            isIconOnly
            variant="ghost"
            aria-label="Ganti tema"
            onPress={toggle}
            className="transition-transform hover:rotate-12"
        >
            {dark ? <Sun size={18} /> : <Moon size={18} />}
        </Button>
    );
}

/* -------------------------------------------------------------------------- */
/*  Sections                                                                  */
/* -------------------------------------------------------------------------- */

function Navbar() {
    const [scrolled, setScrolled] = useState(false);

    useEffect(() => {
        const onScroll = () => setScrolled(window.scrollY > 24);
        onScroll();
        window.addEventListener("scroll", onScroll, { passive: true });
        return () => window.removeEventListener("scroll", onScroll);
    }, []);

    const links = [
        { href: "#fitur", label: "Fitur" },
        { href: "#modul", label: "Modul" },
        { href: "#faq", label: "FAQ" },
    ];

    return (
        <header
            className={`fixed inset-x-0 top-0 z-50 transition-all duration-300 ${scrolled
                ? "border-b border-border bg-background/80 backdrop-blur-xl"
                : "bg-transparent"
                }`}
        >
            <nav className="mx-auto flex h-16 max-w-6xl items-center justify-between px-6">
                <a href="#top" className="flex items-center gap-2.5 font-semibold">
                    <span className="flex size-9 items-center justify-center rounded-xl bg-accent text-accent-foreground shadow-lg shadow-accent/30">
                        <Building2 size={18} />
                    </span>
                    <span className="tracking-tight">SI PANDU</span>
                </a>

                <div className="hidden items-center gap-8 md:flex">
                    {links.map((l) => (
                        <a
                            key={l.href}
                            href={l.href}
                            className="group relative text-sm text-muted transition-colors hover:text-foreground"
                        >
                            {l.label}
                            <span className="absolute -bottom-1 left-0 h-0.5 w-0 rounded-full bg-accent transition-all duration-300 group-hover:w-full" />
                        </a>
                    ))}
                </div>

                <div className="flex items-center gap-1">
                    <ThemeToggle />
                    <Button variant="primary" className="hidden sm:inline-flex">
                        Masuk
                    </Button>
                </div>
            </nav>
        </header>
    );
}

function Hero() {
    const ref = useRef<HTMLElement>(null);

    const onMove = (e: React.MouseEvent) => {
        const el = ref.current;
        if (!el) return;
        const r = el.getBoundingClientRect();
        el.style.setProperty("--mx", `${e.clientX - r.left}px`);
        el.style.setProperty("--my", `${e.clientY - r.top}px`);
    };

    return (
        <section
            id="top"
            ref={ref}
            onMouseMove={onMove}
            className="relative flex h-screen w-screen items-center overflow-hidden bg-background"
            style={{ ["--mx" as string]: "50%", ["--my" as string]: "40%" }}
        >
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
                className="animate-float absolute -left-24 top-24 size-80 rounded-full bg-accent/20 blur-3xl"
            />
            <div
                aria-hidden
                className="animate-float-slow absolute -right-20 bottom-10 size-96 rounded-full bg-success/15 blur-3xl"
            />

            <div className="relative mx-auto grid w-full max-w-6xl items-center gap-12 px-6 pt-16 lg:grid-cols-[1.1fr_0.9fr]">
                <div>
                    <Reveal>
                        <Chip color="accent" variant="soft" className="mb-6">
                            <Sparkles size={14} />
                            <Chip.Label>Pengelolaan BMD, lebih terpadu</Chip.Label>
                        </Chip>
                    </Reveal>

                    <Reveal delay={100}>
                        <h1 className="text-5xl font-bold leading-[1.05] tracking-tight sm:text-6xl lg:text-7xl">
                            Kelola Barang Milik Daerah{" "}
                            <span className="bg-gradient-to-r from-accent to-success bg-clip-text text-transparent">
                                dalam satu pandu.
                            </span>
                        </h1>
                    </Reveal>

                    <Reveal delay={200}>
                        <p className="mt-6 max-w-xl text-lg text-muted">
                            <strong className="text-foreground">SI PANDU</strong> — Sistem
                            Pendukung Pengelolaan BMD Terpadu. Dari replikasi eBMD,
                            perencanaan RKBMD, hingga penggunaan aset, semuanya terhubung.
                        </p>
                    </Reveal>

                    <Reveal delay={300} className="mt-9 flex flex-wrap gap-3">
                        <Button
                            size="lg"
                            variant="primary"
                            className="group shadow-lg shadow-accent/30 transition-transform hover:scale-[1.03]"
                        >
                            Mulai Sekarang
                            <ArrowRight
                                size={18}
                                className="transition-transform group-hover:translate-x-1"
                            />
                        </Button>
                        <Button
                            size="lg"
                            variant="secondary"
                            onPress={() =>
                                document
                                    .getElementById("fitur")
                                    ?.scrollIntoView({ behavior: "smooth" })
                            }
                        >
                            Lihat Fitur
                        </Button>
                    </Reveal>
                </div>

                {/* floating mock dashboard */}
                <Reveal delay={250} className="relative hidden lg:block">
                    <div className="animate-float-slow">
                        <Card className="relative overflow-hidden border border-border shadow-2xl shadow-accent/10">
                            <Card.Header className="flex-row items-center justify-between">
                                <div>
                                    <Card.Title className="text-base">Ringkasan BMD</Card.Title>
                                    <Card.Description>Data tersinkron dari eBMD</Card.Description>
                                </div>
                                <Chip color="success" variant="soft" size="sm">
                                    <Chip.Label>Tersinkron</Chip.Label>
                                </Chip>
                            </Card.Header>
                            <Card.Content className="space-y-4">
                                {[
                                    { l: "Tanah", w: "82%", c: "bg-accent" },
                                    { l: "Gedung & Bangunan", w: "64%", c: "bg-success" },
                                    { l: "Peralatan & Mesin", w: "91%", c: "bg-warning" },
                                ].map((r, i) => (
                                    <div key={r.l}>
                                        <div className="mb-1.5 flex justify-between text-sm">
                                            <span>{r.l}</span>
                                            <span className="text-muted">{r.w}</span>
                                        </div>
                                        <div className="h-2 overflow-hidden rounded-full bg-default">
                                            <div
                                                className={`h-full rounded-full ${r.c} animate-grow`}
                                                style={{ width: r.w, animationDelay: `${i * 150}ms` }}
                                            />
                                        </div>
                                    </div>
                                ))}
                            </Card.Content>
                        </Card>
                    </div>

                    <div className="animate-float absolute -bottom-6 -left-8">
                        <div className="flex items-center gap-3 rounded-2xl border border-border bg-surface px-4 py-3 shadow-xl">
                            <span className="flex size-9 items-center justify-center rounded-xl bg-success/15 text-success">
                                <DatabaseZap size={18} />
                            </span>
                            <div className="text-sm">
                                <p className="font-medium">Replikasi eBMD</p>
                                <p className="text-muted">Baru saja selesai</p>
                            </div>
                        </div>
                    </div>
                </Reveal>
            </div>

            <a
                href="#fitur"
                aria-label="Gulir ke bawah"
                className="absolute bottom-8 left-1/2 -translate-x-1/2"
            >
                <span className="flex h-10 w-6 justify-center rounded-full border-2 border-muted/60 pt-2">
                    <span className="animate-scroll-dot size-1.5 rounded-full bg-muted" />
                </span>
            </a>
        </section>
    );
}

function Stats() {
    const items = [
        { n: 3, s: "+", l: "Modul utama" },
        { n: 100, s: "%", l: "Terintegrasi eBMD" },
        { n: 12, s: "+", l: "Fitur tersedia" },
        { n: 24, s: "/7", l: "Akses kapan saja" },
    ];
    return (
        <section className="border-y border-border bg-surface/50">
            <div className="mx-auto grid max-w-6xl grid-cols-2 gap-8 px-6 py-12 md:grid-cols-4">
                {items.map((it, i) => (
                    <Reveal key={it.l} delay={i * 100} className="text-center">
                        <p className="text-4xl font-bold text-accent">
                            <CountUp to={it.n} suffix={it.s} />
                        </p>
                        <p className="mt-1 text-sm text-muted">{it.l}</p>
                    </Reveal>
                ))}
            </div>
        </section>
    );
}

function Features() {
    return (
        <section id="fitur" className="mx-auto max-w-6xl px-6 py-28">
            <Reveal className="mx-auto mb-14 max-w-2xl text-center">
                <Chip color="accent" variant="soft" className="mb-4">
                    <Chip.Label>Fitur</Chip.Label>
                </Chip>
                <h2 className="text-4xl font-bold tracking-tight">
                    Semua kebutuhan pengelolaan BMD, dalam satu aplikasi
                </h2>
                <p className="mt-4 text-muted">
                    Arahkan kursor ke kartu untuk melihat detailnya.
                </p>
            </Reveal>

            <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
                {FEATURES.map((f, i) => {
                    const Icon = f.icon;
                    return (
                        <Reveal key={f.title} delay={(i % 3) * 100}>
                            <Card className="group relative h-full cursor-pointer overflow-hidden border border-border transition-all duration-300 hover:-translate-y-2 hover:border-accent hover:shadow-2xl hover:shadow-accent/15">
                                {/* hover glow */}
                                <div
                                    aria-hidden
                                    className="absolute -right-10 -top-10 size-40 rounded-full bg-accent/0 blur-2xl transition-all duration-500 group-hover:bg-accent/25"
                                />
                                <Card.Header className="relative">
                                    <div className="mb-4 flex items-center justify-between">
                                        <span className="flex size-12 items-center justify-center rounded-2xl bg-accent/10 text-accent transition-all duration-300 group-hover:rotate-6 group-hover:scale-110 group-hover:bg-accent group-hover:text-accent-foreground">
                                            <Icon size={22} />
                                        </span>
                                        <Chip size="sm" variant="soft">
                                            <Chip.Label>{f.tag}</Chip.Label>
                                        </Chip>
                                    </div>
                                    <Card.Title>{f.title}</Card.Title>
                                    <Card.Description>{f.desc}</Card.Description>
                                </Card.Header>
                                <Card.Footer className="relative mt-auto">
                                    <span className="flex items-center gap-1 text-sm font-medium text-accent opacity-0 transition-all duration-300 group-hover:translate-x-1 group-hover:opacity-100">
                                        Pelajari <ArrowUpRight size={16} />
                                    </span>
                                </Card.Footer>
                            </Card>
                        </Reveal>
                    );
                })}
            </div>
        </section>
    );
}

function Modules() {
    const [active, setActive] = useState("ebmd");
    const current = MODULES.find((m) => m.id === active) ?? MODULES[0];
    const Icon = current.icon;

    return (
        <section
            id="modul"
            className="relative overflow-hidden border-y border-border bg-surface/50 py-28"
        >
            <div className="mx-auto max-w-6xl px-6">
                <Reveal className="mx-auto mb-12 max-w-2xl text-center">
                    <Chip color="success" variant="soft" className="mb-4">
                        <Chip.Label>Modul</Chip.Label>
                    </Chip>
                    <h2 className="text-4xl font-bold tracking-tight">
                        Satu alur dari data hingga keputusan
                    </h2>
                </Reveal>

                <Tabs
                    selectedKey={active}
                    onSelectionChange={(k) => setActive(String(k))}
                    className="w-full"
                >
                    <Tabs.ListContainer className="mb-10 flex justify-center">
                        <Tabs.List aria-label="Modul SI PANDU">
                            {MODULES.map((m) => (
                                <Tabs.Tab key={m.id} id={m.id}>
                                    {m.label}
                                    <Tabs.Indicator />
                                </Tabs.Tab>
                            ))}
                        </Tabs.List>
                    </Tabs.ListContainer>
                </Tabs>

                <div
                    key={current.id}
                    className="animate-swap grid items-center gap-10 lg:grid-cols-2"
                >
                    <div>
                        <span className="mb-5 flex size-14 items-center justify-center rounded-2xl bg-accent text-accent-foreground shadow-lg shadow-accent/30">
                            <Icon size={26} />
                        </span>
                        <h3 className="text-3xl font-semibold tracking-tight">
                            {current.title}
                        </h3>
                        <ul className="mt-6 space-y-3">
                            {current.points.map((p) => (
                                <li
                                    key={p}
                                    className="group flex items-start gap-3 text-muted transition-colors hover:text-foreground"
                                >
                                    <span className="mt-1.5 size-2 shrink-0 rounded-full bg-success transition-transform group-hover:scale-150" />
                                    {p}
                                </li>
                            ))}
                        </ul>
                    </div>

                    <div className="grid grid-cols-3 gap-4">
                        {current.stats.map((s) => (
                            <Card
                                key={s.k}
                                className="border border-border text-center transition-all duration-300 hover:-translate-y-1 hover:border-accent hover:shadow-lg"
                            >
                                <Card.Content className="py-8">
                                    <p className="text-xs uppercase tracking-wider text-muted">
                                        {s.k}
                                    </p>
                                    <p className="mt-2 text-lg font-semibold text-accent">
                                        {s.v}
                                    </p>
                                </Card.Content>
                            </Card>
                        ))}
                    </div>
                </div>
            </div>
        </section>
    );
}

function Faq() {
    return (
        <section id="faq" className="mx-auto max-w-3xl px-6 py-28">
            <Reveal className="mb-10 text-center">
                <h2 className="text-4xl font-bold tracking-tight">
                    Pertanyaan yang sering diajukan
                </h2>
            </Reveal>
            <Reveal delay={100}>
                <Accordion variant="surface">
                    {FAQ.map((f) => (
                        <Accordion.Item key={f.q} id={f.q}>
                            <Accordion.Heading>
                                <Accordion.Trigger>
                                    {f.q}
                                    <Accordion.Indicator />
                                </Accordion.Trigger>
                            </Accordion.Heading>
                            <Accordion.Panel>
                                <Accordion.Body>{f.a}</Accordion.Body>
                            </Accordion.Panel>
                        </Accordion.Item>
                    ))}
                </Accordion>
            </Reveal>
        </section>
    );
}

function Cta() {
    return (
        <section className="px-6 pb-28">
            <Reveal>
                <div className="group relative mx-auto max-w-6xl overflow-hidden rounded-3xl bg-accent p-12 text-center text-accent-foreground sm:p-16">
                    <div
                        aria-hidden
                        className="absolute -left-16 -top-16 size-64 rounded-full bg-white/10 blur-2xl transition-transform duration-700 group-hover:translate-x-24 group-hover:translate-y-10"
                    />
                    <div
                        aria-hidden
                        className="absolute -bottom-20 -right-10 size-72 rounded-full bg-black/10 blur-2xl transition-transform duration-700 group-hover:-translate-x-24"
                    />
                    <FileText className="relative mx-auto mb-5 opacity-80" size={32} />
                    <h2 className="relative text-4xl font-bold tracking-tight">
                        Siap merapikan pengelolaan BMD?
                    </h2>
                    <p className="relative mx-auto mt-4 max-w-xl opacity-90">
                        Masuk ke SI PANDU dan mulai kelola aset daerah dengan lebih terpadu.
                    </p>
                    <div className="relative mt-8">
                        <Button
                            size="lg"
                            variant="secondary"
                            className="transition-transform hover:scale-105"
                        >
                            Masuk ke Aplikasi <ArrowRight size={18} />
                        </Button>
                    </div>
                </div>
            </Reveal>
        </section>
    );
}

function Footer() {
    return (
        <footer className="border-t border-border">
            <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-3 px-6 py-8 text-sm text-muted sm:flex-row">
                <p>© {new Date().getFullYear()} SI PANDU — Sistem Pendukung Pengelolaan BMD Terpadu</p>
                <p>BKAD Kabupaten Pasuruan</p>
            </div>
        </footer>
    );
}

/* -------------------------------------------------------------------------- */
/*  Page                                                                      */
/* -------------------------------------------------------------------------- */

export default function LandingPage() {
    return (
        <main className="min-h-screen overflow-x-hidden bg-background text-foreground">
            <style>{`
        html { scroll-behavior: smooth; }
        @keyframes float { 0%,100% { transform: translateY(0) } 50% { transform: translateY(-14px) } }
        @keyframes grow { from { transform: scaleX(0) } to { transform: scaleX(1) } }
        @keyframes swap { from { opacity: 0; transform: translateY(12px) } to { opacity: 1; transform: none } }
        @keyframes scrolldot { 0% { transform: translateY(0); opacity: 1 } 100% { transform: translateY(14px); opacity: 0 } }
        .animate-float { animation: float 6s ease-in-out infinite }
        .animate-float-slow { animation: float 9s ease-in-out infinite }
        .animate-grow { transform-origin: left; animation: grow 1.2s ease-out both }
        .animate-swap { animation: swap .45s ease-out both }
        .animate-scroll-dot { animation: scrolldot 1.6s ease-in-out infinite }
        @media (prefers-reduced-motion: reduce) {
          .animate-float, .animate-float-slow, .animate-grow, .animate-swap, .animate-scroll-dot { animation: none }
        }
      `}</style>
            <Navbar />
            <Hero />
            <Stats />
            <Features />
            <Modules />
            <Faq />
            <Cta />
            <Footer />
        </main>
    );
}