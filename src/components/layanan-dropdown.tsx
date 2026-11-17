"use client";

import { useState, useRef, useEffect } from "react";
import {
  ChevronDown,
  HeartPulse,
  HandCoins,
  Briefcase,
  Banknote,
  ShieldCheck,
  type LucideIcon,
} from "lucide-react";

type LayananItem = {
  label: string;
  href: string;
  icon: LucideIcon;
  // true = buka tab baru (hanya BPJS Kesehatan -> WhatsApp app/tab baru).
  // false = buka di tab yang sama (navigasi ke situs layanan).
  newTab: boolean;
};

export const layanan: LayananItem[] = [
  {
    label: "Cek BPJS Kesehatan",
    // 08118165165 -> internasional: 62 + 8118165165 = 628118165165
    href: "https://wa.me/628118165165?text=Info%20%26%20Pengaduan",
    icon: HeartPulse,
    newTab: true,
  },
  {
    label: "Cek Bantuan dan Desil",
    href: "https://cekbansos.kemensos.go.id",
    icon: HandCoins,
    newTab: false,
  },
  {
    label: "BPJS Tenaga Kerja",
    href: "https://www.bpjsketenagakerjaan.go.id",
    icon: Briefcase,
    newTab: false,
  },
  {
    label: "Cek BSU Tenaga Kerja",
    href: "https://bsu.kemnaker.go.id",
    icon: Banknote,
    newTab: false,
  },
  {
    label: "Perlinsos",
    href: "https://perlinsos.kemensos.go.id/login-ikd",
    icon: ShieldCheck,
    newTab: false,
  },
];

export function LayananDropdown() {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    function onPointerDown(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") setOpen(false);
    }
    document.addEventListener("mousedown", onPointerDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onPointerDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        aria-haspopup="menu"
        className="flex items-center gap-1 rounded-full px-4 py-2 text-sm font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
      >
        Layanan Masyarakat
        <ChevronDown
          className={open ? "h-4 w-4 transition-transform rotate-180" : "h-4 w-4 transition-transform"}
        />
      </button>
      {open && (
        <div
          role="menu"
          className="absolute left-0 top-full z-50 mt-1 min-w-[260px] rounded-xl border bg-background p-1 shadow-lg"
        >
          {layanan.map((item) => {
            const Icon = item.icon;
            return (
              <a
                key={item.label}
                href={item.href}
                target={item.newTab ? "_blank" : undefined}
                rel={item.newTab ? "noopener noreferrer" : undefined}
                role="menuitem"
                onClick={() => setOpen(false)}
                className="flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors hover:bg-muted"
              >
                <Icon className="h-4 w-4 text-primary" />
                <span>{item.label}</span>
              </a>
            );
          })}
        </div>
      )}
    </div>
  );
}
