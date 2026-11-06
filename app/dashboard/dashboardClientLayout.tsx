"use client";

import { useEffect, useMemo, useState } from "react";
import { useStore } from "@nanostores/react";
import { I18nProvider } from "@react-aria/i18n";
import { ChevronDown, Menu } from "lucide-react";
import { Avatar, Button, Card, ListBox, Label, Modal, Select, cn } from "@heroui/react";
import type { UserWithRole } from "better-auth/plugins";
import { $year } from "@/state/year.store";
import { setUser } from "@/state/user.store";
import SideBar, { getInitials } from "./sidebar";
import Loading from "./loading";

const SIDEBAR_STORAGE_KEY = "sidebar-collapsed";

export default function DashboardClientLayout({
  children,
  user,
}: {
  children: React.ReactNode;
  user: UserWithRole;
}) {
  const selectedYear = useStore($year);

  // `mounted` menandai hidrasi client selesai.
  const [mounted, setMounted] = useState(false);
  // Loading tetap dirender sampai animasi fade-out-nya selesai.
  const [showLoadingOverlay, setShowLoadingOverlay] = useState(true);

  const [isYearModalOpen, setYearModalOpen] = useState(false);

  // Sidebar
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const [isDesktop, setIsDesktop] = useState(false);

  // Drawer mobile selalu tampil penuh; mode minimise hanya berlaku di desktop.
  const sidebarCollapsed = isDesktop && isCollapsed;

  const years = useMemo(() => {
    const currentYear = new Date().getFullYear();
    const start = currentYear + 1; // tahun depan
    const end = 2025;
    const yearArray: string[] = [];
    for (let i = start; i >= end; i--) yearArray.push(String(i));
    return yearArray;
  }, []);

  // Sinkronkan user ke store setiap kali prop berubah (bukan hanya saat mount).
  useEffect(() => {
    setUser(user);
  }, [user]);

  // Hidrasi: baca preferensi sidebar, lalu tandai siap.
  useEffect(() => {
    let stored: string | null = null;
    try {
      stored = localStorage.getItem(SIDEBAR_STORAGE_KEY);
    } catch {
      /* storage tidak tersedia, abaikan */
    }
    // Tanpa preferensi tersimpan: otomatis minimise di layar desktop sempit.
    setIsCollapsed(stored !== null ? stored === "1" : window.innerWidth < 1280);
    setMounted(true);
  }, []);

  // Deteksi breakpoint lg (1024px) dengan matchMedia, bukan window.innerWidth sekali jalan.
  useEffect(() => {
    const mq = window.matchMedia("(min-width: 1024px)");
    const sync = () => {
      setIsDesktop(mq.matches);
      if (mq.matches) setIsMobileOpen(false);
    };
    sync();
    mq.addEventListener("change", sync);
    return () => mq.removeEventListener("change", sync);
  }, []);

  // Tutup drawer mobile dengan Escape.
  useEffect(() => {
    if (!isMobileOpen) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") setIsMobileOpen(false);
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [isMobileOpen]);

  const toggleCollapsed = () => {
    const next = !isCollapsed;
    setIsCollapsed(next);
    try {
      localStorage.setItem(SIDEBAR_STORAGE_KEY, next ? "1" : "0");
    } catch {
      /* abaikan */
    }
  };

  // Titik untuk menambah syarat "siap" lain di masa depan.
  const isPageReady = mounted;

  // Modal tahun wajib dijawab selama tahun belum dipilih; sesudah itu boleh ditutup.
  const isInitialSelection = !selectedYear;
  const isModalOpen = isInitialSelection || isYearModalOpen;

  // Konten baru dirender setelah overlay selesai, supaya setUser() dan
  // preferensi sidebar sudah terpasang sebelum halaman anak membacanya.
  if (showLoadingOverlay) {
    return <Loading isReady={isPageReady} onFinished={() => setShowLoadingOverlay(false)} />;
  }

  return (
    <I18nProvider locale="id-ID">
      <div className="relative flex h-dvh w-full overflow-hidden bg-background text-foreground">
        {/* SIDEBAR CONTAINER */}
        <div
          className={cn(
            "fixed inset-y-0 left-0 z-50 w-[22rem] max-w-[88vw] transition-[transform,width] duration-300 ease-in-out",
            "lg:relative lg:max-w-none lg:flex-none lg:translate-x-0",
            isMobileOpen ? "translate-x-0" : "-translate-x-full",
            sidebarCollapsed ? "lg:w-28" : "lg:w-80",
          )}
        >
          <SideBar
            user={user}
            isCollapsed={sidebarCollapsed}
            onCloseMobile={() => setIsMobileOpen(false)}
            onToggleCollapse={toggleCollapsed}
          />
        </div>

        {/* BACKDROP MOBILE */}
        {isMobileOpen && (
          <div
            className="fixed inset-0 z-40 bg-backdrop backdrop-blur-sm lg:hidden"
            onClick={() => setIsMobileOpen(false)}
          />
        )}

        {/* MAIN CONTENT AREA */}
        <div className="flex h-full min-w-0 flex-1 flex-col overflow-hidden">
          <header className="z-30 w-full flex-none p-4">
            <Card className="shadow-sm backdrop-blur-md">
              <Card.Content className="flex h-14 flex-row items-center justify-between px-4 lg:px-6">
                <div className="flex items-center gap-2 lg:gap-4">
                  {/* Toggle Mobile (toggle desktop sekarang ada di dalam sidebar) */}
                  <Button
                    isIconOnly
                    variant="ghost"
                    className="lg:hidden"
                    aria-label="Buka menu"
                    onPress={() => setIsMobileOpen(true)}
                  >
                    <Menu size={22} />
                  </Button>

                  <div className="hidden flex-col leading-tight sm:flex">
                    <span className="text-[10px] font-bold uppercase tracking-widest text-accent">
                      Dashboard Satu Data
                    </span>
                    <span className="text-sm font-black tracking-tight text-foreground">
                      BKAD KABUPATEN PASURUAN
                    </span>
                  </div>

                  <div className="mx-2 hidden h-6 w-px bg-separator lg:block" />

                  {selectedYear && (
                    <button
                      type="button"
                      onClick={() => setYearModalOpen(true)}
                      className="group flex items-center gap-2 rounded-full border border-separator bg-accent-soft px-3 py-1.5 transition-all hover:bg-accent-soft-hover"
                    >
                      <div className="size-1.5 animate-pulse rounded-full bg-accent" />
                      <span className="text-xs font-bold text-accent-soft-foreground">TA {selectedYear}</span>
                      <ChevronDown
                        size={14}
                        className="text-accent-soft-foreground/70 transition-transform group-hover:translate-y-0.5"
                      />
                    </button>
                  )}
                </div>

                <div className="flex items-center gap-2">
                  <Avatar size="sm">
                    <Avatar.Image alt={user.name} src={user.image ?? undefined} />
                    <Avatar.Fallback delayMs={600}>{getInitials(user.name)}</Avatar.Fallback>
                  </Avatar>
                  <div className="hidden flex-col gap-0 sm:flex">
                    <p className="text-sm font-medium leading-5">{user.name}</p>
                    <p className="text-xs leading-none text-muted">{user.email}</p>
                  </div>
                </div>
              </Card.Content>
            </Card>
          </header>

          <main className="custom-scrollbar flex flex-1 flex-col gap-4 overflow-y-auto p-4">{children}</main>
        </div>

        {/* Modal Pilih Tahun */}
        <Modal.Backdrop
          isOpen={isModalOpen}
          onOpenChange={(open) => {
            if (!isInitialSelection) setYearModalOpen(open);
          }}
          isDismissable={!isInitialSelection}
          isKeyboardDismissDisabled={isInitialSelection}
        >
          <Modal.Container>
            <Modal.Dialog className="sm:max-w-[360px]">
              <Modal.Header className="px-8 pt-8">Pilih Tahun Anggaran</Modal.Header>
              <Modal.Body className="px-8 pb-10">
                <Select
                  aria-label="Tahun Anggaran"
                  placeholder="Pilih tahun"
                  value={selectedYear || null}
                  onChange={(key) => {
                    if (key) {
                      $year.set(String(key));
                      setYearModalOpen(false);
                    }
                  }}
                >
                  <Select.Trigger>
                    <Select.Value />
                    <Select.Indicator />
                  </Select.Trigger>
                  <Select.Popover>
                    <ListBox>
                      {years.map((y) => (
                        <ListBox.Item key={y} id={y} textValue={y}>
                          <Label>{y}</Label>
                          <ListBox.ItemIndicator />
                        </ListBox.Item>
                      ))}
                    </ListBox>
                  </Select.Popover>
                </Select>
              </Modal.Body>
            </Modal.Dialog>
          </Modal.Container>
        </Modal.Backdrop>
      </div>
    </I18nProvider>
  );
}