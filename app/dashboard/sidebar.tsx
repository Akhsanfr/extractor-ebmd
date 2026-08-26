"use client";

import React, { useState, useEffect } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import {
    ShieldCheck, ClipboardCheck,
    ChevronDown,
    Settings, Heart, X,
    ArrowRight,
    UserCog,
    Map
} from "lucide-react";
import { Avatar, Button, Card, cn, Dropdown, Label, Separator, toast, Tooltip } from "@heroui/react";
import { UserContract } from "@/action/user/user/user.contract";
import { authClient } from "@/lib/auth/auth-client";
import { UserWithRole } from "better-auth/plugins";
import { UserRole } from "@/enum/user";
import { useMemo } from "react";

interface MenuItem {
    label: string;
    path?: string;
    icon: React.ReactNode;
    allowedRoles?: UserRole[];
    disAllowRoles?: UserRole[];
    children?: MenuItem[];
}

function parseRoles(
    role: string | null | undefined,
): UserRole[] {

    if (!role) return [];

    return role
        .split(",")
        .map((value) => value.trim())
        .filter(
            (value): value is UserRole =>
                Object.values(UserRole).includes(value as UserRole),
        );
}

const ALL_MENU_ITEMS: MenuItem[] = [
    {
        label: "Pengaturan", path: "/dashboard/pengaturan", icon: <UserCog size={20} />,
        allowedRoles: [UserRole.ADMIN],
        children: [
            { label: "Role Pengguna", path: "/dashboard/pengaturan/user-role", icon: <ClipboardCheck size={18} />, allowedRoles: [UserRole.ADMIN,] },
            { label: "Profil Pengguna", path: "/dashboard/pengaturan/user-profile", icon: <ClipboardCheck size={18} />, allowedRoles: [UserRole.ADMIN,] },
        ]
    },
    {
        label: "Alih Status", path: "/dashboard/alih-status", icon: <UserCog size={20} />,
        allowedRoles: [UserRole.ADMIN],
        children: [
            { label: "Master Data", path: "/dashboard/alih-status/master", icon: <ClipboardCheck size={18} />, allowedRoles: [UserRole.ADMIN,] },
            { label: "Group Persetujuan", path: "/dashboard/alih-status/group-persetujuan", icon: <ClipboardCheck size={18} />, allowedRoles: [UserRole.ADMIN,] },
            { label: "Group Penghapusan", path: "/dashboard/alih-status/group-penghapusan", icon: <ClipboardCheck size={18} />, allowedRoles: [UserRole.ADMIN,] },
        ]
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
                    `role [${overlap.join(", ")}] muncul di allowedRoles DAN disAllowRoles secara bersamaan.`
                );
            }
        }

        if (item.children) {
            validateMenuItemRoles(item.children, currentPath);
        }
    }
}

// Jalankan validasi sekali saat module di-load.
validateMenuItemRoles(ALL_MENU_ITEMS);

/**
 * Mengecek apakah kumpulan roles user boleh mengakses item menu tertentu.
 * - disAllowRoles diprioritaskan: jika role user termasuk di sini, langsung ditolak.
 * - allowedRoles kosong/undefined berarti tidak ada restriksi (boleh semua).
 * - allowedRoles terisi berarti role user harus match salah satu.
 */
function canAccessMenuItem(item: Pick<MenuItem, "allowedRoles" | "disAllowRoles">, roles: UserRole[]): boolean {


    if (item.disAllowRoles?.length && item.disAllowRoles.some((r) => roles.includes(r))) {
        return false;
    }
    if (!item.allowedRoles || item.allowedRoles.length === 0) {
        return true;
    }
    return item.allowedRoles.some((r) => roles.includes(r));
}

export default function SideBar({ user, isCollapsed, onCloseMobile }: { user: UserWithRole, isCollapsed: boolean, onCloseMobile: () => void }) {

    const router = useRouter();

    const roles = useMemo(() => {
        console.log("userrrrr", user)
        return parseRoles(user.role)
    }, [user])


    console.log("roles", roles)


    const handleLogout = async () => {
        try {
            await authClient.signOut()
            toast.success("Berhasil keluar");
            router.push("/");
        } catch (error: any) {
            toast.danger("Gagal keluar", { description: error.message });
        }
    }
    return (
        <aside className="h-full w-full p-4">
            <Card className="h-full border-none shadow-xl backdrop-blur-md">
                <Card.Content className="p-2 flex flex-col overflow-hidden">
                    {/* Header Sidebar */}
                    <div className={cn("flex items-center gap-3", isCollapsed ? "justify-center" : "justify-between")}>
                        <div className="flex items-center gap-3">
                            <div className="flex-none rounded-xl bg-accent flex items-center justify-center text-accent-foreground font-black text-xl p-2">
                                {isCollapsed ? "S" : "SI AKAD"}
                            </div>
                        </div>
                        <Button isIconOnly size="sm" variant="ghost" className="lg:hidden" onPress={onCloseMobile}>
                            <X size={20} />
                        </Button>
                    </div>
                    <div className="text-xs">
                        Sistem Informasi Aplikasi Keuangan dan Aset Daerah
                    </div>

                    {/* Navigasi */}
                    <nav className="flex flex-col gap-1.5 overflow-y-auto custom-scrollbar flex-1 pr-1">
                        {ALL_MENU_ITEMS.map((item, idx) => (
                            <NavItem key={idx} item={item} roles={roles} isCollapsed={isCollapsed} onCloseMobile={onCloseMobile} />
                        ))}
                    </nav>
                    <Separator />
                    {/* Footer */}
                    <div className="mt-auto flex flex-col items-center">
                        <Dropdown>
                            <Dropdown.Trigger className="rounded-full">
                                <Settings />
                            </Dropdown.Trigger>
                            <Dropdown.Popover>
                                <div className="px-3 pt-3 pb-1">
                                    <div className="flex items-center gap-2">
                                        <Avatar size="sm">
                                            <Avatar.Image
                                                alt={user.name}
                                                src={user.image!}
                                            />
                                            <Avatar.Fallback delayMs={600}>JD</Avatar.Fallback>
                                        </Avatar>
                                        <div className="flex flex-col gap-0">
                                            <p className="text-sm leading-5 font-medium">{user.name}</p>
                                            <p className="text-xs leading-none text-muted">{user.email}</p>
                                        </div>
                                    </div>
                                </div>
                                <Dropdown.Menu>
                                    <Dropdown.Item id="dashboard" textValue="Dashboard">
                                        <Label>Dashboard</Label>
                                    </Dropdown.Item>
                                    <Dropdown.Item id="profile" textValue="Profile">
                                        <Label>Profile</Label>
                                    </Dropdown.Item>
                                    <Dropdown.Item id="logout" textValue="Logout" variant="danger">
                                        <div className="flex w-full items-center justify-between gap-2" onClick={handleLogout}>
                                            <Label>Log Out</Label>
                                            <ArrowRight className="size-3.5 text-danger" />
                                        </div>
                                    </Dropdown.Item>
                                </Dropdown.Menu>
                            </Dropdown.Popover>
                        </Dropdown>

                        {!isCollapsed && (
                            <div className="px-4 pb-2">
                                <p className="text-[10px] text-muted">
                                    Built with <Heart size={8} className="inline text-danger fill-danger" /> <span className="font-bold text-foreground uppercase">FR DEV</span>
                                </p>
                            </div>
                        )}
                    </div>
                </Card.Content>
            </Card>
        </aside>
    );
}

function NavItem({ item, roles, isCollapsed, onCloseMobile }: { item: MenuItem, roles: UserRole[], isCollapsed: boolean, onCloseMobile: () => void }) {
    const router = useRouter();
    const pathname = usePathname();
    const searchParams = useSearchParams();

    // Logic Active State
    const checkActive = (path?: string) => {
        if (!path || path === "#") return false;
        const [itemPath, itemQuery] = path.split("?");
        const params = new URLSearchParams(itemQuery);
        const isPathMatch = pathname === itemPath || pathname.startsWith(itemPath + "/");
        if (!isPathMatch) return false;
        for (const [key, val] of params.entries()) {
            if (searchParams.get(key) !== val) return false;
        }
        return true;
    };

    const isActive = checkActive(item.path);
    const hasActiveChild = item.children?.some(c => checkActive(c.path));
    const [isOpen, setIsOpen] = useState(hasActiveChild);

    useEffect(() => { if (hasActiveChild) setIsOpen(true); }, [hasActiveChild]);

    // Jika item ini sendiri tidak boleh diakses, jangan render sama sekali.
    if (!canAccessMenuItem(item, roles)) return null;

    const allowedChildren = item.children?.filter((c) => canAccessMenuItem(c, roles));

    const content = (
        <Button
            isIconOnly={isCollapsed}
            fullWidth={!isCollapsed}
            variant="ghost"
            className={cn(
                "justify-start gap-3 h-11 transition-all duration-200",
                !isCollapsed ? "px-4" : "mx-auto",
                (isActive || hasActiveChild) ? "font-bold shadow-sm bg-accent-soft" : "text-muted"
            )}
            onPress={() => {
                if (allowedChildren && allowedChildren.length > 0 && !isCollapsed) {
                    setIsOpen(!isOpen);
                } else if (item.path) {
                    router.push(item.path);
                    if (window.innerWidth < 1024) onCloseMobile();
                }
            }}
        >
            <div className={cn(isActive || hasActiveChild ? "text-accent" : "text-muted")}>
                {item.icon}
            </div>
            {!isCollapsed && <span className="flex-1 text-left truncate">{item.label}</span>}
            {!isCollapsed && allowedChildren && allowedChildren.length > 0 && (
                <ChevronDown size={16} className={cn("transition-transform", isOpen ? "rotate-180" : "")} />
            )}
        </Button>
    );

    return (
        <div className="flex flex-col gap-1">
            {isCollapsed ? (
                <Tooltip>
                    <Tooltip.Trigger>
                        {content}
                    </Tooltip.Trigger>
                    <Tooltip.Content>
                        <Tooltip.Arrow />
                        {item.label}
                    </Tooltip.Content>
                </Tooltip>
            ) : content}

            {isOpen && !isCollapsed && allowedChildren && allowedChildren.length > 0 && (
                <div className="flex flex-col gap-1 ml-6 pl-2 border-l-2 border-separator mt-1">
                    {allowedChildren.map((child, idx) => (
                        <NavItem key={idx} item={child} roles={roles} isCollapsed={isCollapsed} onCloseMobile={onCloseMobile} />
                    ))}
                </div>
            )}
        </div>
    );
}