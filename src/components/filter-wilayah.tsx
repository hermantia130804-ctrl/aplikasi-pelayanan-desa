"use client";

import { useCallback, useEffect, useState } from "react";
import { pendudukRTAction } from "@/lib/server/actions/penduduk-rt";
import { MapPin } from "lucide-react";

export interface OpsiWilayah {
  noRt: string;
  noRw: string;
}

/**
 * Muat daftar opsi wilayah (RT/RW) untuk dropdown filter.
 * Hanya untuk ADMIN/PETUGAS (server menolak role lain).
 */
export function useOpsiWilayah(isStaff: boolean) {
  const [opsi, setOpsi] = useState<OpsiWilayah[]>([]);
  const muat = useCallback(async () => {
    if (!isStaff) return;
    try {
      const r = await pendudukRTAction("listRT", {});
      if (r.status === 200 && Array.isArray(r.data)) {
        setOpsi(r.data as OpsiWilayah[]);
      }
    } catch {
      // diamkan: dropdown tetap menampilkan "Semua RT/RW"
    }
  }, [isStaff]);
  useEffect(() => {
    muat();
  }, [muat]);
  return { opsi };
}

interface FilterWilayahProps {
  opsi: OpsiWilayah[];
  value: string; // "SEMUA" atau "noRt|noRw"
  onChange: (v: string) => void;
}

/**
 * Dropdown filter RT/RW (hanya dirender untuk ADMIN/PETUGAS).
 * Nilai disimpan sebagai "noRt|noRw" agar pasangan RT-RW unik.
 */
export function FilterWilayah({ opsi, value, onChange }: FilterWilayahProps) {
  return (
    <div className="relative min-w-[150px] max-w-[200px]">
      <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
      <select
        value={value}
        onChange={e => onChange(e.target.value)}
        aria-label="Filter RT/RW"
        className="h-9 w-full rounded-md border border-input bg-transparent pl-9 pr-3 py-1 text-sm shadow-sm outline-none focus:ring-1 focus:ring-emerald-600 focus:border-emerald-600 appearance-none cursor-pointer"
        style={{ backgroundImage: "none" }}
      >
        <option value="SEMUA">Semua RT/RW</option>
        {opsi.map(o => (
          <option key={`${o.noRt}-${o.noRw}`} value={`${o.noRt}|${o.noRw}`}>
            RT.{o.noRt} · RW.{o.noRw}
          </option>
        ))}
      </select>
    </div>
  );
}

/** Pecah nilai filter menjadi parameter server (undefined jika SEMUA). */
export function pecahFilterWilayah(value: string): { filterRt?: string; filterRw?: string } {
  if (!value || value === "SEMUA") return {};
  const [rt, rw] = value.split("|");
  return { filterRt: rt || undefined, filterRw: rw || undefined };
}
