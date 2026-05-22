"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const NAV_ITEMS = [
    { href: "/rkbmd", label: "Dashboard", exact: true },
    { href: "/rkbmd/pengadaan", label: "Pengadaan", exact: false },
    { href: "/rkbmd/pemeliharaan", label: "Pemeliharaan", exact: false },
];

export default function RkbmdLayout({ children }: { children: React.ReactNode }) {
    const pathname = usePathname();

    return (
        <div className="min-h-screen flex flex-col bg-background">
            {/* ── Top Bar ── */}
            <header className="sticky top-0 z-30 border-b border-default-200 bg-background/80 backdrop-blur-md">
                <div className="max-w-7xl mx-auto px-6 flex items-center justify-between h-14">
                    {/* Brand + breadcrumb */}
                    <div className="flex items-center gap-3">
                        <Link
                            href="/"
                            className="text-xs font-medium text-default-400 hover:text-default-700 transition-colors"
                        >
                            ← Import BMD
                        </Link>
                        <span className="text-default-300 text-xs">/</span>
                        <span className="text-xs font-semibold text-foreground">RKBMD</span>
                    </div>

                    {/* Nav links */}
                    <nav className="flex items-center gap-1">
                        {NAV_ITEMS.map(({ href, label, exact }) => {
                            const isActive = exact
                                ? pathname === href
                                : pathname.startsWith(href);
                            return (
                                <Link
                                    key={href}
                                    href={href}
                                    className={[
                                        "px-3 py-1.5 rounded-lg text-sm font-medium transition-all",
                                        isActive
                                            ? "bg-accent text-accent-foreground shadow-sm"
                                            : "hover:text-accent",
                                    ].join(" ")}
                                >
                                    {label}
                                </Link>
                            );
                        })}
                    </nav>
                </div>
            </header>

            {/* ── Page content ── */}
            <main className="flex-1">{children}</main>
        </div>
    );
}
