import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { ThemeProvider } from "@/components/theme-provider";
import { Toaster } from "@/components/ui/sonner";
import { NuqsAdapter } from 'nuqs/adapters/next/app'
import { LiveChatWidget } from "@/components/live-chat-widget";
import { findCurrentSessionService } from "@/lib/server/services/session";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: {
    default: "Desa Sukamaju — Kecamatan Cibungbulang, Kabupaten Bogor",
    template: "%s | Desa Sukamaju",
  },
  description:
    "Portal resmi Pelayanan Desa Sukamaju: pengajuan surat administrasi online, informasi desa, dan transparansi pelayanan publik.",
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  // Sesi diambil sekali di root layout agar LiveChatWidget tampil di SEMUA
  // halaman (publik + dashboard) dan tahu status login: login -> jawab personal
  // (NIK + bansos); tamu -> jawab umum + arahkan login untuk cek bansos pribadi.
  const session = await findCurrentSessionService();
  return (
    <html lang="id" suppressHydrationWarning>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
         <ThemeProvider
            attribute="class"
            defaultTheme="system"
            enableSystem
            disableTransitionOnChange
          >
            <NuqsAdapter>
            {children}
            </NuqsAdapter>
            <Toaster />
            <LiveChatWidget loggedIn={!!session?.user} />
          </ThemeProvider>
      </body>
    </html>
  );
}
