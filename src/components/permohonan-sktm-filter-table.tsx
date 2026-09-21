"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useDebounce } from "@/hooks/use-debounce";
import { delay } from "@/lib/utils";
import { IconRefresh } from "@tabler/icons-react";
import { useRouter } from "next/navigation";
import { parseAsString, useQueryState } from "nuqs";
import { useEffect } from "react";

export const PermohonanSKTMFilterTable = () => {
  const router = useRouter();

  const [status, setStatus] = useQueryState("status", parseAsString);
  const [searchField, setSearchField] = useQueryState("searchField", parseAsString.withDefault("nama"));
  const [search, setSearch] = useQueryState("search", parseAsString.withDefault(""));
  
  const debouncedSearch = useDebounce(search, 300);

  useEffect(() => {
    const onSearchChange = async () => {
      await delay(100);
      router.refresh();
    };
    onSearchChange();
  }, [debouncedSearch, router]);

  const onSearchFieldChange = async (value: string) => {
    setSearchField(value);
    await delay(100);
    router.refresh();
  };

  const onStatusChange = async (value: string) => {
    setStatus(value === "all" ? null : value);
    await delay(100);
    router.refresh();
  };

  const onReset = async () => {
    setStatus(null);
    setSearchField("nama");
    setSearch("");
    await delay(100);
    router.refresh();
  };

  return (
    <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
      <div className="flex w-full max-w-sm items-center gap-2">
        <Input
          placeholder={`Cari berdasarkan ${searchField}...`}
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="h-9"
        />
        <Select value={searchField} onValueChange={onSearchFieldChange}>
          <SelectTrigger className="h-9 w-[130px]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="nama">Nama</SelectItem>
            <SelectItem value="nik">NIK</SelectItem>
            <SelectItem value="alamat">Alamat</SelectItem>
            <SelectItem value="nomor">Nomor</SelectItem>
          </SelectContent>
        </Select>
        <Button variant="outline" size="icon" onClick={onReset} className="h-9 w-9">
          <IconRefresh className="h-4 w-4" />
        </Button>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <Select value={status || "all"} onValueChange={onStatusChange}>
          <SelectTrigger className="h-9 w-[130px]">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Semua Status</SelectItem>
            <SelectItem value="DIAJUKAN">Diajukan</SelectItem>
            <SelectItem value="DISETUJUI">Disetujui</SelectItem>
            <SelectItem value="DITOLAK">Ditolak</SelectItem>
          </SelectContent>
        </Select>
        <Button variant="outline" onClick={() => router.refresh()} className="h-9">
          Refresh
        </Button>
      </div>
    </div>
  );
};
