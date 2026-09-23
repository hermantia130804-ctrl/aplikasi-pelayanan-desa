import Link from "next/link";
import Image from "next/image";
import { ModeToggle } from "@/components/mode-toggle";

export default function PublicLayout({ children }: { children: React.ReactNode }) {
    const menu = [
        { label: "Beranda", url: "/" },
        { label: "Beranda Masyarakat", url: "/beranda-masyarakat" },
        { label: "Tentang", url: "/tentang" },
        { label: "Hubungi Kami", url: "/hubungi-kami" },
    ];

    return (
        <div className="flex min-h-screen flex-col bg-background text-foreground">
            <header className="sticky top-0 z-50 border-b bg-background/95 backdrop-blur">
                <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4 sm:px-6">
                    <Link href="/" className="flex items-center gap-2.5">
                        <Image
                            src="/logo-kab-bogor.png"
                            alt="Logo Kab. Bogor"
                            width={40}
                            height={40}
                            className="size-10 object-contain"
                        />
                        <span className="leading-tight">
                            <span className="block text-base font-bold tracking-tight">Desa Sukamaju</span>
                            <span className="block text-[11px] font-medium text-muted-foreground">
                                Kec. Cibungbulang, Kab. Bogor
                            </span>
                        </span>
                    </Link>

                    <nav className="hidden items-center gap-1 lg:flex">
                        {menu.map((m) => (
                            <Link
                                key={m.url}
                                href={m.url}
                                className="rounded-full px-3 py-2 text-sm font-medium transition-colors hover:bg-muted hover:text-foreground"
                            >
                                {m.label}
                            </Link>
                        ))}
                    </nav>

                    <div className="flex items-center gap-2">
                        <ModeToggle />
                        <Link
                            href="/masuk"
                            className="rounded-full bg-primary px-4 py-2 text-sm font-bold text-primary-foreground shadow-md transition-all hover:-translate-y-0.5"
                        >
                            Masuk / Daftar
                        </Link>
                    </div>
                </div>

                {/* Menu mobile */}
                <nav className="flex items-center gap-1 overflow-x-auto border-t px-4 py-2 lg:hidden">
                    {menu.map((m) => (
                        <Link
                            key={m.url}
                            href={m.url}
                            className="whitespace-nowrap rounded-full px-3 py-1.5 text-xs font-medium transition-colors hover:bg-muted"
                        >
                            {m.label}
                        </Link>
                    ))}
                </nav>
            </header>

            <main className="flex-1">{children}</main>

            <footer className="border-t py-6">
                <div className="mx-auto max-w-6xl px-4 text-center text-sm text-muted-foreground sm:px-6">
                    © 2026 Pemerintah Desa Sukamaju · Kecamatan Cibungbulang · Kabupaten Bogor
                </div>
            </footer>
        </div>
    );
}
