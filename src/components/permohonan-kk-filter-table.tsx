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

export const PermohonanKKFilterTable = () => {
  const router = useRouter();

  const [alasan, setAlasan] = useQueryState("alasan", parseAsString);
  const [status, setStatus] = useQueryState("status", parseAsString);
  const [searchBy, setSearchBy] = useQueryState("searchBy", parseAsString.withDefault("nama"));
  const [searchValue, setSearchValue] = useQueryState("searchValue", parseAsString.withDefault(""));

  const debouncedSearchValue = useDebounce(searchValue, 300);

  useEffect(() => {
    const onSearchChange = async () => {
      await delay(100);
      router.refresh();
    };
    onSearchChange();
  }, [debouncedSearchValue, router]);

  const onSearchByChange = async (value: string) => {
    setSearchBy(value);
    await delay(100);
    router.refresh();
  };

  const onStatusChange = async (value: string) => {
    setStatus(value);
    await delay(100);
    router.refresh();
  };

  const onAlasanChange = async (value: string) => {
    setAlasan(value);
    await delay(100);
    router.refresh();
  };

  const onReset = async () => {
    setAlasan(null);
    setStatus(null);
    setSearchBy("nama");
    setSearchValue("");
    await delay(100);
    router.refresh();
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
      <div className="flex flex-row items-center gap-2">
        <Select
          value={searchBy}
          onValueChange={onSearchByChange}
        >
          <SelectTrigger>
            <SelectValue placeholder="Cari berdasarkan" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="nama">Nama</SelectItem>
            <SelectItem value="nik">NIK</SelectItem>
            <SelectItem value="alamat">Alamat</SelectItem>
            <SelectItem value="nomorPermohonan">No. Permohonan</SelectItem>
          </SelectContent>
        </Select>
        <Input
          placeholder="Cari..."
          value={searchValue}
          onChange={(e) => setSearchValue(e.target.value)}
        />
      </div>
      <div className="flex items-center gap-2">
        <Select
          value={status || "-"}
          onValueChange={onStatusChange}
        >
          <SelectTrigger>
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem disabled value="-">Status</SelectItem>
            <SelectItem value="DIAJUKAN">Diajukan</SelectItem>
            <SelectItem value="DISETUJUI">Disetujui</SelectItem>
            <SelectItem value="DITOLAK">Ditolak</SelectItem>
          </SelectContent>
        </Select>
        <Select
          value={alasan || "-"}
          onValueChange={onAlasanChange}
        >
          <SelectTrigger>
            <SelectValue placeholder="Alasan" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem disabled value="-">Alasan</SelectItem>
            <SelectItem value="BARU">Baru</SelectItem>
            <SelectItem value="PERUBAHAN_DATA">Perubahan Data</SelectItem>
            <SelectItem value="PENGGANTIAN">Penggantian</SelectItem>
            <SelectItem value="PEMISAHAN_KK">Pemisahan KK</SelectItem>
          </SelectContent>
        </Select>
        <Button
          variant="ghost"
          className="size-8"
          size="icon"
          onClick={onReset}
        >
          <span className="sr-only">Reset</span>
          <IconRefresh />
        </Button>
      </div>
    </div>
  );
};
