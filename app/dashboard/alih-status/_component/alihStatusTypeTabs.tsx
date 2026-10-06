"use client";

import { Tabs } from "@heroui/react";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useCallback, useEffect } from "react";
import { AlihStatusType } from "@/enum/alihStatus";

export const JENIS_TABS = [
    {
        slug: "pengalihan-status-penggunaan",
        type: AlihStatusType.PENGALIHAN_STATUS_PENGGUNAAN,
    },
    {
        slug: "pengalihan-status-penggunaan-dari-pengelola",
        type: AlihStatusType.PENGALIHAN_STATUS_PENGGUNAAN_DARI_PENGELOLA,
    },
    {
        slug: "penyerahan-kepada-pengelola",
        type: AlihStatusType.PENYERAHAN_KEPADA_PENGELOLA,
    },
] as const;

export type Jenis = (typeof JENIS_TABS)[number]["slug"];

export const JENIS_DEFAULT: Jenis = JENIS_TABS[0].slug;

const ALL_TYPES: readonly AlihStatusType[] = JENIS_TABS.map((t) => t.type);

const SLUG_TO_TYPE = Object.fromEntries(
    JENIS_TABS.map((t) => [t.slug, t.type]),
) as Record<Jenis, AlihStatusType>;

/** Tab yang tersedia, sesuai urutan JENIS_TABS (bukan urutan input). */
function getTabs(allowed: readonly AlihStatusType[]) {
    const tabs = JENIS_TABS.filter((t) => allowed.includes(t.type));
    return tabs.length > 0 ? tabs : JENIS_TABS;
}

/** Slug valid & diizinkan -> dipakai. Selain itu -> tab pertama yang tersedia. */
export function parseJenis(
    raw: string | null | undefined,
    allowed: readonly AlihStatusType[] = ALL_TYPES,
): Jenis {
    const tabs = getTabs(allowed);
    return tabs.find((t) => t.slug === raw)?.slug ?? tabs[0].slug;
}

export function jenisToType(jenis: Jenis): AlihStatusType {
    return SLUG_TO_TYPE[jenis];
}

export function useJenis(allowed: readonly AlihStatusType[] = ALL_TYPES) {
    const router = useRouter();
    const pathname = usePathname();
    const searchParams = useSearchParams();

    const raw = searchParams.get("jenis");
    const allowedKey = allowed.join(","); // stabil walau array dibuat inline
    // eslint-disable-next-line react-hooks/exhaustive-deps
    const jenis = parseJenis(raw, allowed);
    const alihStatusType = jenisToType(jenis);

    const setJenis = useCallback(
        (next: Jenis) => {
            const params = new URLSearchParams(searchParams.toString());
            params.set("jenis", next);
            params.delete("page");
            router.replace(`${pathname}?${params.toString()}`, { scroll: false });
        },
        [router, pathname, searchParams],
    );

    // Query ada tapi tidak didukung page ini -> ganti ke tab pertama yang tersedia
    useEffect(() => {
        if (raw !== null && raw !== jenis) {
            setJenis(jenis);
        }
    }, [raw, jenis, allowedKey, setJenis]);

    return { jenis, alihStatusType, setJenis };
}

type JenisTabsProps = {
    /** Type yang ditampilkan. Default: semua. */
    types?: readonly AlihStatusType[];
};

export function JenisTabs({ types = ALL_TYPES }: JenisTabsProps) {
    const { jenis, setJenis } = useJenis(types);
    const tabs = getTabs(types);

    return (
        <Tabs
            selectedKey={jenis}
            onSelectionChange={(key) => setJenis(String(key) as Jenis)}
        >
            <Tabs.ListContainer>
                <Tabs.List aria-label="Jenis alih status">
                    {tabs.map((t) => (
                        <Tabs.Tab key={t.slug} id={t.slug}>
                            {t.type}
                            <Tabs.Indicator />
                        </Tabs.Tab>
                    ))}
                </Tabs.List>
            </Tabs.ListContainer>
        </Tabs>
    );
}