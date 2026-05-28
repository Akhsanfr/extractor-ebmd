import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Tool BMD",
  description: "Aplikasi untuk mempermudah pengelolaan barang milik daerah",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-screen text-foreground max-w-5xl mx-auto bg-cyan-500">
        <div className="flex flex-col gap-4 items-center p-6 bg-red-500">
          {children}
        </div>
      </body>

    </html >
  );
}
