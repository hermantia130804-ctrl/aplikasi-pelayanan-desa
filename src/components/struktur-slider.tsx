"use client";

import { useEffect, useRef, useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";

type Anggota = {
  strukturId: string;
  nama: string;
  jabatan: string;
  fotoUrl: string | null;
};

const INTERVAL = 4000;

export function StrukturSlider({ anggota }: { anggota: Anggota[] }) {
  const [index, setIndex] = useState(0);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const resetTimer = () => {
    if (timerRef.current) clearInterval(timerRef.current);
    if (anggota.length > 1) {
      timerRef.current = setInterval(() => {
        setIndex((i) => (i + 1) % anggota.length);
      }, INTERVAL);
    }
  };

  useEffect(() => {
    resetTimer();
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [anggota.length]);

  const go = (dir: 1 | -1) => {
    setIndex((i) => (i + dir + anggota.length) % anggota.length);
    resetTimer();
  };

  const goto = (i: number) => {
    setIndex(i);
    resetTimer();
  };

  if (anggota.length === 0) return null;
  const p = anggota[index];

  return (
    <div className="mx-auto max-w-md">
      <div className="relative overflow-hidden rounded-2xl border bg-card shadow-sm">
        <div key={p.strukturId} className="flex flex-col items-center p-8 text-center animate-in fade-in slide-in-from-right-4 duration-500">
          {p.fotoUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={p.fotoUrl} alt={p.nama} className="size-32 rounded-full object-cover ring-4 ring-primary/20" />
          ) : (
            <div className="flex size-32 items-center justify-center rounded-full bg-primary/10 text-4xl font-black text-primary ring-4 ring-primary/10">
              {p.nama.charAt(0).toUpperCase()}
            </div>
          )}
          <h3 className="mt-5 text-xl font-bold">{p.nama}</h3>
          <p className="mt-1 text-sm font-medium text-primary">{p.jabatan}</p>
        </div>

        {/* Tombol panah */}
        {anggota.length > 1 && (
          <>
            <button
              type="button"
              onClick={() => go(-1)}
              aria-label="Sebelumnya"
              className="absolute left-2 top-1/2 -translate-y-1/2 rounded-full border bg-background/80 p-2 shadow-sm transition-colors hover:bg-muted"
            >
              <ChevronLeft className="size-5" />
            </button>
            <button
              type="button"
              onClick={() => go(1)}
              aria-label="Berikutnya"
              className="absolute right-2 top-1/2 -translate-y-1/2 rounded-full border bg-background/80 p-2 shadow-sm transition-colors hover:bg-muted"
            >
              <ChevronRight className="size-5" />
            </button>
          </>
        )}
      </div>

      {/* Titik indikator */}
      {anggota.length > 1 && (
        <div className="mt-4 flex items-center justify-center gap-2">
          {anggota.map((a, i) => (
            <button
              key={a.strukturId}
              type="button"
              onClick={() => goto(i)}
              aria-label={"Ke " + a.nama}
              className={"h-2 rounded-full transition-all " + (i === index ? "w-6 bg-primary" : "w-2 bg-muted-foreground/30 hover:bg-muted-foreground/50")}
            />
          ))}
        </div>
      )}
    </div>
  );
}
