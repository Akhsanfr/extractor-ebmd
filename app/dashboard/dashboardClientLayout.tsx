"use client";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { $year } from "@/state/year.store";
import { $user, setUser } from "@/state/user.store";
import { useStore } from "@nanostores/react";
import { I18nProvider } from '@react-aria/i18n';

import { useEffect, useState, useMemo } from "react";
import SideBar from "./sidebar";
import {
  ChevronDown,
  Menu,
  ChevronLeft,
} from "lucide-react";
import { Badge, Button, Card, Dropdown, Modal, Spinner, Select, Label, Description, ListBox, Header, Avatar, cn } from "@heroui/react";
import { UserContract } from "@/action/user/user/user.contract";
import Loading from "./loading";
import { UserWithRole } from "better-auth/plugins";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60,
      retry: 1,
    },
  },
})

export default function DashboardClientLayout({
  children,
  user,
}: {
  children: React.ReactNode;
  user: UserWithRole;
}) {
  const selectedYear = useStore($year);

  // `mounted` menandai hidrasi client selesai. Sebelumnya baris setMounted(true)
  // ter-comment, jadi state ini tidak pernah berubah dan Loading tampil selamanya.
  const [mounted, setMounted] = useState(false);
  // Loading tetap dirender (sebagai overlay) sampai proses fade-out-nya selesai,
  // meskipun `mounted` sudah true — supaya transisinya mulus, bukan mendadak hilang.
  const [showLoadingOverlay, setShowLoadingOverlay] = useState(true);

  const [isYearModalOpen, setYearModalOpen] = useState(false);

  // State untuk Sidebar
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isMobileOpen, setIsMobileOpen] = useState(false);

  const years = useMemo(() => {
    const currentYear = new Date().getFullYear();
    const start = currentYear + 1; // Start from next year
    const end = 2025; // Example end year, adjust as needed
    const yearArray: string[] = [];
    for (let i = start; i >= end; i--) {
      yearArray.push(String(i));
    }
    return yearArray;
  }, []);

  useEffect(() => {
    setMounted(true);
    setUser(user);
    // Collapse otomatis jika layar tablet
    if (window.innerWidth < 720) setIsCollapsed(true);
  }, []);

  // Titik untuk menambah syarat "siap" lain di masa depan, misalnya menunggu
  // data tambahan selesai fetch — cukup && kan kondisinya di sini.
  const isPageReady = mounted;

  const isInitialSelection = selectedYear === undefined || user === null || selectedYear === "";
  const isModalOpen = isInitialSelection || isYearModalOpen;
  if (
    showLoadingOverlay) return (
      <Loading
        isReady={isPageReady}
        onFinished={() => setShowLoadingOverlay(false)}
      />
    )


  return (
    <I18nProvider locale="id-ID">
      <QueryClientProvider client={queryClient}>

        <div className="relative flex h-screen w-full bg-background overflow-hidden text-foreground">
          {/* Konten asli tetap dirender & bisa mulai mount di baliknya,
          Loading menutupinya sebagai overlay sampai isPageReady true. */}

          {/* SIDEBAR CONTAINER */}
          <div
            className={cn(
              "fixed inset-y-0 left-0 z-50 transition-all duration-300 ease-in-out lg:relative lg:translate-x-0",
              isMobileOpen ? "translate-x-0" : "-translate-x-full",
              isCollapsed ? "lg:w-30" : "lg:w-72",
            )}
          >
            <SideBar
              user={user}
              isCollapsed={isCollapsed}
              onCloseMobile={() => setIsMobileOpen(false)}
            />
          </div>

          {/* BACKDROP MOBILE */}
          {isMobileOpen && (
            <div
              className="fixed inset-0 bg-backdrop backdrop-blur-sm z-40 lg:hidden"
              onClick={() => setIsMobileOpen(false)}
            />
          )}

          {/* MAIN CONTENT AREA */}
          <div className="flex-1 flex flex-col min-w-0 h-full overflow-hidden">
            <header className="w-full flex-none p-4 z-30">
              <Card className="shadow-sm backdrop-blur-md">
                <Card.Content className="flex flex-row h-14 items-center justify-between px-4 lg:px-6">
                  <div className="flex items-center justify-between gap-2 lg:gap-4">

                    {/* Toggle Mobile */}
                    <Button
                      isIconOnly
                      className="lg:hidden"
                      onPress={() => setIsMobileOpen(true)}
                    >
                      <Menu size={22} />
                    </Button>

                    {/* Toggle Desktop */}
                    <Button
                      isIconOnly
                      size="sm"
                      variant="outline"
                      className="hidden lg:flex"
                      onPress={() => setIsCollapsed(!isCollapsed)}
                    >
                      <ChevronLeft
                        size={18}
                        className={cn(
                          "transition-transform duration-300",
                          isCollapsed && "rotate-180",
                        )}
                      />
                    </Button>

                    <div className="hidden sm:flex flex-col leading-tight">
                      <span className="text-[10px] font-bold text-accent uppercase tracking-widest">
                        Dashboard Satu Data
                      </span>
                      <span className="text-sm font-black text-foreground tracking-tight">
                        BKAD KABUPATEN PASURUAN
                      </span>
                    </div>

                    <div className="hidden lg:block h-6 w-px bg-separator mx-2" />

                    {selectedYear && (
                      <button
                        onClick={() => setYearModalOpen(true)}
                        className="flex items-center gap-2 px-3 py-1.5 bg-accent-soft hover:bg-accent-soft-hover border border-separator rounded-full transition-all group"
                      >
                        <div className="w-1.5 h-1.5 rounded-full bg-accent animate-pulse" />
                        <span className="text-xs font-bold text-accent-soft-foreground">
                          TA {selectedYear}
                        </span>
                        <ChevronDown
                          size={14}
                          className="text-accent-soft-foreground/70 group-hover:translate-y-0.5 transition-transform"
                        />
                      </button>
                    )}

                  </div>
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

                </Card.Content>
              </Card>
            </header>

            <main className="flex-1 overflow-y-auto custom-scrollbar flex flex-col gap-4 p-4">
              {/* <div className="max-w-[1600px] mx-auto space-y-6 pt-2"> */}
              {children}
              {/* <section className="w-full"></section> */}
              {/* </div> */}
            </main>
          </div>

          {/* Modal Pilih Tahun */}
          <Modal.Backdrop
            isOpen={isModalOpen}
          >
            <Modal.Container>
              <Modal.Dialog className="sm:max-w-[360px]">
                <Modal.Header className="pt-8 px-8">Pilih Tahun Anggaran</Modal.Header>
                <Modal.Body className="pb-10 px-8">
                  <Select
                    value={selectedYear}
                    onChange={(keys) => {
                      console.log("k", keys)
                      if (keys) {
                        $year.set(keys.toString());
                        setYearModalOpen(false);
                      }
                    }}>
                    <Label />
                    <Select.Trigger>
                      <Select.Value />
                      <Select.Indicator />
                    </Select.Trigger>
                    <Description />
                    <Select.Popover>
                      <ListBox>
                        <ListBox.Item>
                          <Label>Pilih Tahun</Label>
                          <Description>Pilih untuk mengganti tahun</Description>
                          <ListBox.ItemIndicator />
                        </ListBox.Item>
                        <ListBox.Section>
                          <Header />
                          {years.map((y) => (
                            <ListBox.Item key={y} textValue={y} id={y}>
                              <Label>{y}</Label>
                              <ListBox.ItemIndicator />
                            </ListBox.Item>
                          ))}
                        </ListBox.Section>
                      </ListBox>
                    </Select.Popover>
                  </Select>
                </Modal.Body>
              </Modal.Dialog>
            </Modal.Container>
          </Modal.Backdrop>
        </div>
      </QueryClientProvider>
    </I18nProvider>
  );
}