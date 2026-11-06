"use client";

import React, { useEffect, useMemo, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import {
    ArrowRightLeft,
    BadgeCheck,
    ChevronDown,
    ChevronsLeft,
    ChevronsUpDown,
    ClipboardCheck,
    FileSignature,
    FileText,
    FileX,
    Heart,
    LayoutDashboard,
    LogOut,
    PackageCheck,
    Settings2,
    ShieldCheck,
    Trash2,
    UserRound,
    X,
    type LucideIcon,
} from "lucide-react";
import { Avatar, Button, Card, Dropdown, Label, Separator, Tooltip, cn, toast } from "@heroui/react";
import { authClient } from "@/lib/auth/auth-client";
import type { UserWithRole } from "better-auth/plugins";
import { UserRole } from "@/enum/user";

/* -------------------------------------------------------------------------- */
/*  Helpers                                                                   */
/* -------------------------------------------------------------------------- */

const EXCLUDED_PARAMS = ["page"];

function withSearchParams(path: string, current: { toString(): string }): string {
    const [base, query] = path.split("?");
    const params = new URLSearchParams(current.toString());

    EXCLUDED_PARAMS.forEach((key) => params.delete(key));

    // Jika path menu punya query sendiri, nilainya menimpa yang dibawa.
    new URLSearchParams(query).forEach((value, key) => params.set(key, value));

    const qs = params.toString();
    return qs ? `${base}?${qs}` : base;
}

export function getInitials(name?: string | null): string {
    if (!name) return "?";
    return name
        .trim()
        .split(/\s+/)
        .slice(0, 2)
        .map((part) => part[0]?.toUpperCase() ?? "")
        .join("");
}

function parseRoles(role: string | null | undefined): UserRole[] {
    if (!role) return [];

    return role
        .split(",")
        .map((value) => value.trim())
        .filter((value): value is UserRole => Object.values(UserRole).includes(value as UserRole));
}

/* -------------------------------------------------------------------------- */
/*  Konfigurasi menu                                                          */
/* -------------------------------------------------------------------------- */

interface MenuItem {
    label: string;
    /** Item yang punya `children` hanya berfungsi sebagai grup (tidak navigasi). */
    path?: string;
    icon: LucideIcon;
    allowedRoles?: UserRole[];
    disAllowRoles?: UserRole[];
    children?: MenuItem[];
}

// Setiap item punya ikon yang berbeda, supaya di mode minimise (icon only)
// anak-anak menu tetap bisa dibedakan satu sama lain.
const ALL_MENU_ITEMS: MenuItem[] = [
    {
        label: "Pengaturan",
        icon: Settings2,
        allowedRoles: [UserRole.ADMIN],
        children: [
            { label: "Role Pengguna", path: "/dashboard/pengaturan/user-role", icon: ShieldCheck, allowedRoles: [UserRole.ADMIN] },
            { label: "Profil Pengguna", path: "/dashboard/pengaturan/user-profile", icon: UserRound, allowedRoles: [UserRole.ADMIN] },
        ],
    },
    {
        label: "Alih Status",
        icon: ArrowRightLeft,
        allowedRoles: [UserRole.ADMIN],
        children: [
            { label: "Permohonan", path: "/dashboard/alih-status/permohonan", icon: FileText, allowedRoles: [UserRole.ADMIN] },
            { label: "BA Penelitian", path: "/dashboard/alih-status/ba-penelitian", icon: ClipboardCheck, allowedRoles: [UserRole.ADMIN] },
            { label: "Nota Dinas", path: "/dashboard/alih-status/nota-dinas", icon: FileSignature, allowedRoles: [UserRole.ADMIN] },
            { label: "Persetujuan Bupati", path: "/dashboard/alih-status/persetujuan-bupati", icon: BadgeCheck, allowedRoles: [UserRole.ADMIN] },
            { label: "BAST", path: "/dashboard/alih-status/bast", icon: PackageCheck, allowedRoles: [UserRole.ADMIN] },
            { label: "Permohonan Penghapusan", path: "/dashboard/alih-status/permohonan-penghapusan", icon: FileX, allowedRoles: [UserRole.ADMIN] },
            { label: "SK Hapus", path: "/dashboard/alih-status/sk-hapus", icon: Trash2, allowedRoles: [UserRole.ADMIN] },
        ],
    },
];

/**
 * Validasi konflik antara allowedRoles & disAllowRoles.
 * Jika ada role yang sama-sama disebutkan di kedua list pada satu item,
 * konfigurasi dianggap ambigu -> throw error sedini mungkin (saat module load).
 */
function validateMenuItemRoles(items: MenuItem[], parentPath: string[] = []) {
    for (const item of items) {
        const currentPath = [...parentPath, item.label];

        if (item.allowedRoles?.length && item.disAllowRoles?.length) {
            const overlap = item.allowedRoles.filter((r) => item.disAllowRoles!.includes(r));
            if (overlap.length > 0) {
                throw new Error(
                    `[SideBar] Konflik role pada menu "${currentPath.join(" > ")}": ` +
                    `role [${overlap.join(", ")}] muncul di allowedRoles DAN disAllowRoles secara bersamaan.`,
                );
            }
        }

        if (item.children) validateMenuItemRoles(item.children, currentPath);
    }
}

validateMenuItemRoles(ALL_MENU_ITEMS);

/**
 * - disAllowRoles diprioritaskan: jika role user termasuk di sini, langsung ditolak.
 * - allowedRoles kosong/undefined berarti tidak ada restriksi.
 * - allowedRoles terisi berarti role user harus match salah satu.
 */
function canAccessMenuItem(item: Pick<MenuItem, "allowedRoles" | "disAllowRoles">, roles: UserRole[]): boolean {
    if (item.disAllowRoles?.length && item.disAllowRoles.some((r) => roles.includes(r))) return false;
    if (!item.allowedRoles || item.allowedRoles.length === 0) return true;
    return item.allowedRoles.some((r) => roles.includes(r));
}

/**
 * Filter seluruh tree berdasarkan role, sekali saja di awal.
 * Grup yang semua anaknya terfilter ikut dibuang, jadi tidak ada grup kosong.
 */
function filterMenu(items: MenuItem[], roles: UserRole[]): MenuItem[] {
    return items.flatMap((item) => {
        if (!canAccessMenuItem(item, roles)) return [];
        if (!item.children) return [item];

        const children = filterMenu(item.children, roles);
        return children.length > 0 ? [{ ...item, children }] : [];
    });
}

function flattenLeaves(items: MenuItem[]): MenuItem[] {
    return items.flatMap((item) => (item.children ? flattenLeaves(item.children) : [item]));
}

type IsActiveFn = (path?: string) => boolean;

function isBranchActive(item: MenuItem, isActive: IsActiveFn): boolean {
    if (item.children) return item.children.some((child) => isBranchActive(child, isActive));
    return isActive(item.path);
}

/* -------------------------------------------------------------------------- */
/*  Sidebar                                                                   */
/* -------------------------------------------------------------------------- */

interface SideBarProps {
    user: UserWithRole;
    isCollapsed: boolean;
    onCloseMobile: () => void;
    onToggleCollapse: () => void;
}

export default function SideBar({ user, isCollapsed, onCloseMobile, onToggleCollapse }: SideBarProps) {
    const router = useRouter();
    const pathname = usePathname();
    const searchParams = useSearchParams();

    const roles = useMemo(() => parseRoles(user.role), [user.role]);
    const menu = useMemo(() => filterMenu(ALL_MENU_ITEMS, roles), [roles]);

    // useSearchParams dipanggil sekali di sini, bukan di tiap item menu.
    const isActive: IsActiveFn = (path) => {
        if (!path || path === "#") return false;
        const [itemPath, itemQuery] = path.split("?");
        if (!(pathname === itemPath || pathname.startsWith(itemPath + "/"))) return false;
        for (const [key, val] of new URLSearchParams(itemQuery).entries()) {
            if (searchParams.get(key) !== val) return false;
        }
        return true;
    };

    const navigate = (path?: string) => {
        if (!path) return;
        router.push(withSearchParams(path, searchParams));
        if (window.innerWidth < 1024) onCloseMobile();
    };

    const handleLogout = async () => {
        // better-auth mengembalikan { error } dan tidak melempar exception,
        // jadi hasilnya harus dicek, bukan mengandalkan try/catch.
        const { error } = await authClient.signOut();
        if (error) {
            toast.danger("Gagal keluar", { description: error.message });
            return;
        }
        toast.success("Berhasil keluar");
        router.push("/");
        router.refresh();
    };

    return (
        <aside className="h-full w-full p-4">
            {/* p-0 gap-0 di Card: padding bawaan Card + padding Card.Content sebelumnya
                menumpuk dan menyisakan area dalam ~8px saat sidebar diminimise. */}
            <Card className="h-full gap-0 border border-separator/60 p-0 shadow-sm">
                <Card.Content className="flex h-full min-h-0 w-full flex-col gap-3 p-3">
                    {/* Header */}
                    <div className={cn("flex items-center gap-3", isCollapsed && "flex-col")}>
                        <div className="grid size-10 flex-none place-items-center rounded-xl bg-accent text-lg font-black text-accent-foreground">
                            S
                        </div>

                        {!isCollapsed && (
                            <div className="min-w-0 flex-1 leading-tight">
                                <p className="text-sm font-black tracking-tight">SI PANDU</p>
                                <p className="line-clamp-2 text-[11px] text-muted">
                                    Sistem Pendukung Pengelolaan BMD Terpadu
                                </p>
                            </div>
                        )}

                        {/* Minimise / perluas (desktop) */}
                        <Button
                            isIconOnly
                            size="sm"
                            variant="ghost"
                            className="hidden flex-none lg:flex"
                            aria-label={isCollapsed ? "Perluas sidebar" : "Kecilkan sidebar"}
                            onPress={onToggleCollapse}
                        >
                            <ChevronsLeft
                                size={18}
                                className={cn("transition-transform duration-300", isCollapsed && "rotate-180")}
                            />
                        </Button>

                        {/* Tutup (mobile) */}
                        <Button
                            isIconOnly
                            size="sm"
                            variant="ghost"
                            className="flex-none lg:hidden"
                            aria-label="Tutup menu"
                            onPress={onCloseMobile}
                        >
                            <X size={20} />
                        </Button>
                    </div>

                    <Separator className="shrink-0" />

                    {/* Navigasi */}
                    <nav
                        aria-label="Menu utama"
                        className={cn(
                            "custom-scrollbar flex min-h-0 w-full flex-1 flex-col overflow-y-auto overflow-x-hidden",
                            isCollapsed ? "items-center gap-4 py-1" : "gap-1",
                        )}
                    >
                        {!isCollapsed && (
                            <p className="px-3 pb-1 text-[10px] font-bold uppercase tracking-widest text-muted">Menu</p>
                        )}

                        {menu.map((item) =>
                            isCollapsed ? (
                                item.children ? (
                                    <RailGroup key={item.label} item={item} isActive={isActive} onNavigate={navigate} />
                                ) : (
                                    <RailButton key={item.label} item={item} active={isActive(item.path)} onNavigate={navigate} />
                                )
                            ) : (
                                <ExpandedItem key={item.label} item={item} isActive={isActive} onNavigate={navigate} />
                            ),
                        )}
                    </nav>

                    <Separator className="shrink-0" />

                    {/* Footer */}
                    <div className="flex flex-col gap-2">
                        <Dropdown>
                            <Dropdown.Trigger
                                aria-label="Menu akun"
                                className={cn(
                                    "rounded-xl transition-colors hover:bg-default",
                                    isCollapsed ? "mx-auto p-1" : "w-full p-2",
                                )}
                            >
                                <div className="flex items-center gap-3">
                                    <Avatar size="sm">
                                        <Avatar.Image alt={user.name} src={user.image ?? undefined} />
                                        <Avatar.Fallback delayMs={600}>{getInitials(user.name)}</Avatar.Fallback>
                                    </Avatar>
                                    {!isCollapsed && (
                                        <>
                                            <div className="min-w-0 flex-1 text-left">
                                                <p className="truncate text-sm font-medium leading-5">{user.name}</p>
                                                <p className="truncate text-xs leading-none text-muted">{user.email}</p>
                                            </div>
                                            <ChevronsUpDown size={16} className="flex-none text-muted" />
                                        </>
                                    )}
                                </div>
                            </Dropdown.Trigger>
                            <Dropdown.Popover placement="top start">
                                <Dropdown.Menu
                                    onAction={(key) => {
                                        if (key === "dashboard") router.push("/dashboard");
                                        if (key === "logout") void handleLogout();
                                    }}
                                >
                                    <Dropdown.Item id="dashboard" textValue="Dashboard">
                                        <LayoutDashboard className="size-4 text-muted" />
                                        <Label>Dashboard</Label>
                                    </Dropdown.Item>
                                    <Dropdown.Item id="logout" textValue="Keluar" variant="danger">
                                        <LogOut className="size-4 text-danger" />
                                        <Label>Keluar</Label>
                                    </Dropdown.Item>
                                </Dropdown.Menu>
                            </Dropdown.Popover>
                        </Dropdown>

                        {!isCollapsed && (
                            <p className="px-2 text-[10px] text-muted">
                                Built with <Heart size={8} className="inline fill-danger text-danger" />{" "}
                                <span className="font-bold uppercase text-foreground">FR DEV</span>
                            </p>
                        )}
                    </div>
                </Card.Content>
            </Card>
        </aside>
    );
}

/* -------------------------------------------------------------------------- */
/*  Mode expanded: tree dengan label                                          */
/* -------------------------------------------------------------------------- */

interface ItemProps {
    item: MenuItem;
    isActive: IsActiveFn;
    onNavigate: (path?: string) => void;
}

function ExpandedItem({ item, isActive, onNavigate, depth = 0 }: ItemProps & { depth?: number }) {
    const Icon = item.icon;
    const hasChildren = !!item.children?.length;
    const branchActive = isBranchActive(item, isActive);

    const [open, setOpen] = useState(branchActive);
    useEffect(() => {
        if (branchActive) setOpen(true);
    }, [branchActive]);

    return (
        <div className="flex flex-col">
            <Button
                fullWidth
                variant="ghost"
                aria-expanded={hasChildren ? open : undefined}
                aria-current={!hasChildren && branchActive ? "page" : undefined}
                className={cn(
                    "justify-start gap-3 rounded-xl px-3 transition-colors",
                    depth === 0 ? "h-10 text-sm" : "h-9 text-[13px]",
                    branchActive
                        ? hasChildren
                            ? "font-semibold text-accent"
                            : "bg-accent-soft font-semibold text-accent"
                        : "text-muted hover:text-foreground",
                )}
                onPress={() => (hasChildren ? setOpen((prev) => !prev) : onNavigate(item.path))}
            >
                <Icon size={depth === 0 ? 20 : 18} className="flex-none" />
                <span className="flex-1 truncate text-left">{item.label}</span>
                {hasChildren && (
                    <ChevronDown
                        size={16}
                        className={cn("flex-none transition-transform duration-200", open && "rotate-180")}
                    />
                )}
            </Button>

            {hasChildren && (
                <div
                    className={cn(
                        "grid transition-[grid-template-rows] duration-200 ease-out",
                        open ? "grid-rows-[1fr]" : "grid-rows-[0fr]",
                    )}
                >
                    {/* inert: anak yang tertutup tidak bisa difokus lewat keyboard */}
                    <div className="overflow-hidden" inert={!open}>
                        <div className="ml-[1.375rem] mt-1 flex flex-col gap-0.5 border-l border-separator pl-2">
                            {item.children!.map((child) => (
                                <ExpandedItem
                                    key={child.label}
                                    item={child}
                                    isActive={isActive}
                                    onNavigate={onNavigate}
                                    depth={depth + 1}
                                />
                            ))}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

/* -------------------------------------------------------------------------- */
/*  Mode minimise: icon only, struktur tree tetap terbaca                     */
/*  Ikon grup di atas, anak-anaknya di dalam "tray" tepat di bawahnya.        */
/* -------------------------------------------------------------------------- */

function RailButton({
    item,
    active,
    onNavigate,
    small = false,
}: {
    item: MenuItem;
    active: boolean;
    onNavigate: (path?: string) => void;
    small?: boolean;
}) {
    const Icon = item.icon;

    return (
        <Tooltip>
            <Tooltip.Trigger>
                <Button
                    isIconOnly
                    variant="ghost"
                    aria-label={item.label}
                    aria-current={active ? "page" : undefined}
                    className={cn(
                        "shrink-0 rounded-xl transition-colors",
                        small ? "size-9 min-w-9" : "size-10 min-w-10",
                        active ? "bg-accent-soft text-accent" : "text-muted hover:text-foreground",
                    )}
                    onPress={() => onNavigate(item.path)}
                >
                    <Icon size={small ? 18 : 20} />
                </Button>
            </Tooltip.Trigger>
            <Tooltip.Content placement="right">
                <Tooltip.Arrow />
                {item.label}
            </Tooltip.Content>
        </Tooltip>
    );
}

function RailGroup({ item, isActive, onNavigate }: ItemProps) {
    const Icon = item.icon;
    const active = isBranchActive(item, isActive);
    const leaves = useMemo(() => flattenLeaves(item.children ?? []), [item.children]);

    return (
        <div className="flex shrink-0 flex-col items-center gap-1.5">
            {/* Penanda grup (tidak navigasi) */}
            <Tooltip>
                <Tooltip.Trigger>
                    <div
                        tabIndex={0}
                        aria-label={item.label}
                        className={cn(
                            "grid size-10 place-items-center rounded-xl outline-none focus-visible:ring-2 focus-visible:ring-focus",
                            active ? "text-accent" : "text-muted",
                        )}
                    >
                        <Icon size={20} />
                    </div>
                </Tooltip.Trigger>
                <Tooltip.Content placement="right">
                    <Tooltip.Arrow />
                    {item.label}
                </Tooltip.Content>
            </Tooltip>

            <div className="flex shrink-0 flex-col items-center gap-1 rounded-2xl bg-default/40 p-1.5">
                {leaves.map((leaf) => (
                    <RailButton key={leaf.label} item={leaf} small active={isActive(leaf.path)} onNavigate={onNavigate} />
                ))}
            </div>
        </div>
    );
}