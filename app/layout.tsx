import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { Providers } from "./provider";

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
      <body className="text-foreground max-w-6xl mx-auto bg-background">
        <Providers>
          <div className="min-h-screen flex flex-col gap-4 items-center p-6 bg-background-secondary">
            {children}
          </div>
        </Providers>
      </body>

    </html >
  );
}
