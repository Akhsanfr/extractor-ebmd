"use client";
import { useEffect, useState, type ReactNode } from "react";
import Link from "next/link";
import { Button, Chip } from "@heroui/react";
import { Building2, Moon, Sun } from "lucide-react";

// Halaman rekon dirender tanpa layout induk, jadi shell ini menyediakan
// header, latar, container, dan footer dengan gaya yang sama seperti landing page SI PANDU.

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

function Navbar() {
    const [scrolled, setScrolled] = useState(false);

    useEffect(() => {
        const onScroll = () => setScrolled(window.scrollY > 8);
        onScroll();
        window.addEventListener("scroll", onScroll, { passive: true });
        return () => window.removeEventListener("scroll", onScroll);
    }, []);

    return (
        <header
            className={`fixed inset-x-0 top-0 z-50 transition-all duration-300 ${scrolled ? "border-b border-border bg-background/80 backdrop-blur-xl" : "bg-transparent"
                }`}
        >
            <nav className="mx-auto flex h-16 max-w-7xl items-center justify-between px-6">
                <div className="flex items-center gap-3">
                    <Link href="/" className="flex items-center gap-2.5 font-semibold">
                        <span className="flex size-9 items-center justify-center rounded-xl bg-accent text-accent-foreground shadow-lg shadow-accent/30">
                            <Building2 size={18} />
                        </span>
                        <span className="tracking-tight">SI PANDU</span>
                    </Link>
                    <span aria-hidden className="hidden h-5 w-px bg-border sm:block" />
                    <Chip color="accent" variant="soft" size="sm" className="hidden sm:inline-flex">
                        <Chip.Label>Rekon BMD</Chip.Label>
                    </Chip>
                </div>

                <div className="flex items-center gap-1">
                    <ThemeToggle />
                </div>
            </nav>
        </header>
    );
}

export default function RekonShell({ children }: { children: ReactNode }) {
    return (
        <div className="relative flex min-h-screen flex-col overflow-x-hidden bg-background text-foreground">
            {/* latar: grid + blob lembut di bagian atas */}
            <div aria-hidden className="pointer-events-none absolute inset-x-0 top-0 h-[480px] overflow-hidden">
                <div
                    className="absolute inset-0 opacity-[0.35]"
                    style={{
                        backgroundImage:
                            "linear-gradient(to right, var(--border) 1px, transparent 1px), linear-gradient(to bottom, var(--border) 1px, transparent 1px)",
                        backgroundSize: "56px 56px",
                        maskImage: "linear-gradient(to bottom, black 15%, transparent 90%)",
                        WebkitMaskImage: "linear-gradient(to bottom, black 15%, transparent 90%)",
                    }}
                />
                <div className="absolute -left-24 top-10 size-80 rounded-full bg-accent/20 blur-3xl" />
                <div className="absolute -right-20 top-24 size-96 rounded-full bg-success/15 blur-3xl" />
            </div>

            <Navbar />

            <main className="relative mx-auto w-full max-w-7xl flex-1 px-6 pb-16 pt-24">{children}</main>

            <footer className="relative border-t border-border">
                <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-3 px-6 py-6 text-sm text-muted sm:flex-row">
                    <p>© {new Date().getFullYear()} SI PANDU — Sistem Pendukung Pengelolaan BMD Terpadu</p>
                    <p>Kabupaten Pasuruan</p>
                </div>
            </footer>
        </div>
    );
}