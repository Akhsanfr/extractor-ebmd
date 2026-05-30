"use client";

import { Button, Card } from "@heroui/react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect } from "react";

const NAV_ITEMS = [
    { href: "/rkbmd", label: "Dashboard", exact: true },
    { href: "/rkbmd/pengadaan", label: "Pengadaan", exact: false },
    { href: "/rkbmd/pemeliharaan", label: "Pemeliharaan", exact: false },
];

export default function RkbmdLayout({ children }: { children: React.ReactNode }) {
    const pathname = usePathname();
    useEffect(() => {
        console.log("Navbar mounted");
    }, []);
    return (
        <>
            <Card className="sticky top-0 z-30 w-full backdrop-blur-md">
                {/* ── Top Bar ── */}
                <Card.Content className="flex flex-row items-center justify-between">
                    {/* Brand + breadcrumb */}
                    <div className="flex items-center gap-3">
                        <Link
                            href="/"
                            className="font-bold text-accent hover:text-default-700 transition-colors"
                        >
                            ← BMD TOOL
                        </Link>
                    </div>

                    {/* Nav links */}
                    <nav>
                        <ul className="flex items-center gap-2 p-2">
                            {NAV_ITEMS.map(({ href, label, exact }) => {
                                const isActive = exact
                                    ? pathname === href
                                    : pathname.startsWith(href);

                                return (
                                    <li key={href}>
                                        <Link
                                            href={href}
                                            className={[
                                                "inline-flex items-center rounded-full px-4 py-2 text-sm font-medium transition-all duration-200",
                                                isActive
                                                    ? "bg-accent text-accent-foreground shadow-sm"
                                                    : "hover:bg-content2 hover:text-foreground",
                                            ].join(" ")}
                                            aria-current={isActive ? "page" : undefined}
                                        >
                                            {label}
                                        </Link>
                                    </li>
                                );
                            })}
                        </ul>
                    </nav>
                </Card.Content >
            </Card>
            {children}
        </>)
}
