"use client";

import Image from "next/image";
import Link from "next/link";
import { Menu } from "lucide-react";
import { useState } from "react";
import { ModeToggle } from "@/components/mode-toggle";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";

type MenuItem = { label: string; url: string };

export function PublicMobileMenu({ menu, isLoggedIn }: { menu: MenuItem[]; isLoggedIn: boolean }) {
    const [open, setOpen] = useState(false);

    return (
        <Sheet open={open} onOpenChange={setOpen}>
            <SheetTrigger asChild>
                <Button variant="outline" size="icon" className="lg:hidden">
                    <Menu className="size-5" />
                    <span className="sr-only">Buka menu</span>
                </Button>
            </SheetTrigger>
            <SheetContent side="right" className="w-72">
                <SheetHeader className="text-left">
                    <SheetTitle className="flex items-center gap-2">
                        <Image src="/logo-kab-bogor.png" alt="Logo" width={28} height={28} className="size-7 object-contain" />
                        Desa Sukamaju
                    </SheetTitle>
                </SheetHeader>

                <nav className="flex flex-col gap-1 px-4">
                    {menu.map((m) => (
                        <Link
                            key={m.url}
                            href={m.url}
                            onClick={() => setOpen(false)}
                            className="rounded-lg px-3 py-2.5 text-sm font-medium transition-colors hover:bg-muted"
                        >
                            {m.label}
                        </Link>
                    ))}
                </nav>

                <div className="mt-4 flex flex-col gap-2 border-t px-4 pt-4">
                    {isLoggedIn ? (
                        <Button asChild className="w-full" onClick={() => setOpen(false)}>
                            <Link href="/dashboard">Buka Aplikasi</Link>
                        </Button>
                    ) : (
                        <Button asChild className="w-full" onClick={() => setOpen(false)}>
                            <Link href="/masuk">Masuk / Daftar</Link>
                        </Button>
                    )}
                    <div className="flex items-center justify-between rounded-lg px-3 py-2">
                        <span className="text-sm text-muted-foreground">Mode Gelap</span>
                        <ModeToggle />
                    </div>
                </div>
            </SheetContent>
        </Sheet>
    );
}
