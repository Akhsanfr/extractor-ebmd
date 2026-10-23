"use client";

import { useRef, useState } from "react";
import { Button, Card, Chip } from "@heroui/react";
import { ArrowLeft, Building2, ShieldCheck, UserCog } from "lucide-react";
import { authClient } from "@/lib/auth/auth-client";

const isDev = process.env.NODE_ENV === "development";

function GoogleIcon() {
  return (
    <svg viewBox="0 0 24 24" width={18} height={18} aria-hidden>
      <path
        fill="#4285F4"
        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.27-4.74 3.27-8.1z"
      />
      <path
        fill="#34A853"
        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84A11 11 0 0 0 12 23z"
      />
      <path
        fill="#FBBC05"
        d="M5.84 14.1a6.6 6.6 0 0 1 0-4.2V7.06H2.18a11 11 0 0 0 0 9.88l3.66-2.84z"
      />
      <path
        fill="#EA4335"
        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1A11 11 0 0 0 2.18 7.06l3.66 2.84C6.71 7.31 9.14 5.38 12 5.38z"
      />
    </svg>
  );
}

export default function Auth() {
  const ref = useRef<HTMLElement>(null);
  const [loading, setLoading] = useState<"google" | "admin" | null>(null);
  const [error, setError] = useState<string | null>(null);

  const onMove = (e: React.MouseEvent) => {
    const el = ref.current;
    if (!el) return;
    const r = el.getBoundingClientRect();
    el.style.setProperty("--mx", `${e.clientX - r.left}px`);
    el.style.setProperty("--my", `${e.clientY - r.top}px`);
  };

  const signIn = async () => {
    setError(null);
    setLoading("google");
    try {
      await authClient.signIn.social({ provider: "google" });
    } catch {
      setError("Gagal masuk dengan Google. Silakan coba lagi.");
      setLoading(null);
    }
  };

  const signInAdmin = async () => {
    setError(null);
    setLoading("admin");
    try {
      const res = await authClient.signIn.email({
        email: "admin@example.com",
        password: "fr112358",
      });
      if (res?.error) setError(res.error.message ?? "Gagal masuk sebagai admin.");
    } catch {
      setError("Gagal masuk sebagai admin.");
    } finally {
      setLoading(null);
    }
  };

  return (
    <main
      ref={ref}
      onMouseMove={onMove}
      className="relative flex h-screen w-screen items-center justify-center overflow-hidden bg-background text-foreground"
      style={{ ["--mx" as string]: "50%", ["--my" as string]: "40%" }}
    >
      <style>{`
        @keyframes float { 0%,100% { transform: translateY(0) } 50% { transform: translateY(-14px) } }
        @keyframes rise { from { opacity: 0; transform: translateY(16px) } to { opacity: 1; transform: none } }
        .animate-float { animation: float 6s ease-in-out infinite }
        .animate-float-slow { animation: float 9s ease-in-out infinite }
        .animate-rise { animation: rise .6s ease-out both }
        @media (prefers-reduced-motion: reduce) {
          .animate-float, .animate-float-slow, .animate-rise { animation: none }
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
        className="animate-float absolute -left-24 top-24 size-80 rounded-full bg-accent/20 blur-3xl"
      />
      <div
        aria-hidden
        className="animate-float-slow absolute -right-20 bottom-10 size-96 rounded-full bg-success/15 blur-3xl"
      />

      {/* back to landing */}
      <a
        href="/"
        className="group absolute left-6 top-6 flex items-center gap-2 text-sm text-muted transition-colors hover:text-foreground"
      >
        <ArrowLeft
          size={16}
          className="transition-transform group-hover:-translate-x-1"
        />
        Kembali
      </a>

      <div className="animate-rise relative w-full max-w-md px-6">
        <Card className="border border-border shadow-2xl shadow-accent/10 transition-shadow duration-300 hover:shadow-accent/20">
          <Card.Header className="items-center gap-3 pt-8 text-center">
            <span className="flex size-14 items-center justify-center rounded-2xl bg-accent text-accent-foreground shadow-lg shadow-accent/30">
              <Building2 size={26} />
            </span>
            <Chip color="accent" variant="soft" size="sm">
              <ShieldCheck size={12} />
              <Chip.Label>Akses Terbatas</Chip.Label>
            </Chip>
            <Card.Title className="text-2xl font-bold tracking-tight">
              Masuk ke{" "}
              <span className="bg-gradient-to-r from-accent to-success bg-clip-text text-transparent">
                SI PANDU
              </span>
            </Card.Title>
            <Card.Description>
              Sistem Pendukung Pengelolaan BMD Terpadu
            </Card.Description>
          </Card.Header>

          <Card.Content className="flex flex-col gap-3 pb-2">
            <Button
              size="lg"
              variant="primary"
              fullWidth
              isPending={loading === "google"}
              isDisabled={loading !== null}
              onPress={signIn}
              className="shadow-lg shadow-accent/30 transition-transform hover:scale-[1.02]"
            >
              <GoogleIcon />
              Masuk dengan Google
            </Button>

            {isDev && (
              <Button
                size="lg"
                variant="secondary"
                fullWidth
                isPending={loading === "admin"}
                isDisabled={loading !== null}
                onPress={signInAdmin}
                className="transition-transform hover:scale-[1.02]"
              >
                <UserCog size={18} />
                Masuk sebagai Admin (dev)
              </Button>
            )}

            {error && (
              <p
                role="alert"
                className="rounded-xl bg-danger/10 px-3 py-2 text-center text-sm text-danger"
              >
                {error}
              </p>
            )}
          </Card.Content>

          <Card.Footer className="justify-center pb-8 pt-4">
            <p className="text-center text-xs text-muted">
              Dengan masuk, Anda menyetujui penggunaan sistem sesuai ketentuan
              pengelolaan BMD.
            </p>
          </Card.Footer>
        </Card>
      </div>
    </main>
  );
}