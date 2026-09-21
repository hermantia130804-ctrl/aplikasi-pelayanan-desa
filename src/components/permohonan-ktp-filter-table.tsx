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

export const PermohonanKTPFilterTable = () => {
  const router = useRouter();

  const [jenis, setJenis] = useQueryState("jenis", parseAsString);
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

  const onJenisChange = async (value: string) => {
    setJenis(value);
    await delay(100);
    router.refresh();
  };

  const onReset = async () => {
    setJenis(null);
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
            <SelectItem value="nomor">Nomor</SelectItem>
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
          value={jenis || "-"}
          onValueChange={onJenisChange}
        >
          <SelectTrigger>
            <SelectValue placeholder="Jenis" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem disabled value="-">Jenis</SelectItem>
            <SelectItem value="BARU">Baru</SelectItem>
            <SelectItem value="PERUBAHAN">Perubahan</SelectItem>
            <SelectItem value="PENGGANTIAN">Penggantian</SelectItem>
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
