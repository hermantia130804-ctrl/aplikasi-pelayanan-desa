import Link from "next/link";
import Image from "next/image";
import { ModeToggle } from "@/components/mode-toggle";
import { findCurrentSessionService } from "@/lib/server/services/session";
import { PublicMobileMenu } from "@/components/public-mobile-menu";
import { ScrollToTop } from "@/components/scroll-to-top";
import { IdleGuard } from "@/components/idle-guard";

export default async function PublicLayout({ children }: { children: React.ReactNode }) {
    const session = await findCurrentSessionService();

    const menu = [
        { label: "Beranda", url: "/" },
        { label: "Beranda Masyarakat", url: "/beranda-masyarakat" },
        { label: "Tentang", url: "/tentang" },
        { label: "Hubungi Kami", url: "/hubungi-kami" },
    ];

    return (
        <div className="flex min-h-screen flex-col bg-background text-foreground">
            <ScrollToTop />
            {session?.user ? <IdleGuard /> : null}
            <header className="sticky top-0 z-50 border-b bg-background/80 backdrop-blur-xl">
                <div className="mx-auto flex h-16 max-w-7xl items-center justify-between gap-3 px-4 py-3 sm:px-6">
                    {/* Logo */}
                    <Link href="/" className="flex items-center gap-3">
                        <Image
                            src="/logo-kab-bogor.png"
                            alt="Logo Kab. Bogor"
                            width={44}
                            height={44}
                            className="size-11 object-contain"
                        />
                        <span className="leading-tight">
                            <span className="block text-base font-black tracking-tight">Desa Sukamaju</span>
                            <span className="hidden text-[10px] font-semibold uppercase tracking-wider text-muted-foreground sm:block">
                                Kec. Cibungbulang · Kab. Bogor
                            </span>
                        </span>
                    </Link>

                    {/* Menu desktop */}
                    <nav className="hidden items-center gap-0.5 lg:flex">
                        {menu.map((m) => (
                            <Link
                                key={m.url}
                                href={m.url}
                                className="rounded-full px-4 py-2 text-sm font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
                            >
                                {m.label}
                            </Link>
                        ))}
                    </nav>

                    {/* Kanan: mode + auth (desktop) atau hamburger (mobile) */}
                    <div className="flex items-center gap-2.5">
                        <span className="hidden sm:block">
                            <ModeToggle />
                        </span>

                        {session?.user ? (
                            <Link
                                href="/dashboard"
                                className="hidden rounded-full bg-primary px-5 py-2.5 text-sm font-bold text-primary-foreground shadow-lg shadow-primary/25 transition-all hover:-translate-y-0.5 lg:inline-flex"
                            >
                                Buka Aplikasi
                            </Link>
                        ) : (
                            <Link
                                href="/masuk"
                                className="hidden rounded-full bg-primary px-5 py-2.5 text-sm font-bold text-primary-foreground shadow-lg shadow-primary/25 transition-all hover:-translate-y-0.5 lg:inline-flex"
                            >
                                Masuk / Daftar
                            </Link>
                        )}

                        {/* Hamburger mobile */}
                        <PublicMobileMenu menu={menu} isLoggedIn={!!session?.user} />
                    </div>
                </div>
            </header>

            <main className="flex-1">{children}</main>

            <footer className="border-t bg-muted/30">
                <div className="mx-auto grid max-w-7xl gap-8 px-4 py-12 sm:px-6 md:grid-cols-3">
                    <div>
                        <div className="flex items-center gap-3">
                            <Image src="/logo-kab-bogor.png" alt="Logo" width={36} height={36} className="size-9 object-contain" />
                            <span className="font-black">Desa Sukamaju</span>
                        </div>
                        <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
                            Portal resmi pelayanan administrasi dan informasi Desa Sukamaju,
                            Kecamatan Cibungbulang, Kabupaten Bogor.
                        </p>
                    </div>
                    <div>
                        <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Navigasi</p>
                        <ul className="mt-3 space-y-2 text-sm">
                            {menu.map((m) => (
                                <li key={m.url}>
                                    <Link href={m.url} className="text-muted-foreground transition-colors hover:text-foreground">
                                        {m.label}
                                    </Link>
                                </li>
                            ))}
                        </ul>
                    </div>
                    <div>
                        <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Kontak</p>
                        <ul className="mt-3 space-y-2 text-sm text-muted-foreground">
                            <li>Jl. K.H Abdul Hamid, Sukamaju, Cibungbulang, Kab. Bogor 16630</li>
                            <li>+62 812-8569-9854</li>
                        </ul>
                    </div>
                </div>
                <div className="border-t py-4 text-center text-xs text-muted-foreground">
                    © 2026 Pemerintah Desa Sukamaju · Kecamatan Cibungbulang · Kabupaten Bogor
                </div>
            </footer>
        </div>
    );
}
