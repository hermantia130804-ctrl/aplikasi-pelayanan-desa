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

export const PermohonanSKLFilterTable = () => {
  const router = useRouter();

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

  const onRefresh = async () => {
    await delay(100);
    router.refresh();
  };

  const onReset = async () => {
    setStatus(null);
    setSearchBy("nama");
    setSearchValue("");
    await delay(100);
    router.refresh();
  };

  return (
    <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
      <div className="flex flex-1 flex-col gap-4 sm:flex-row sm:items-center">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
          <Select value={searchBy} onValueChange={onSearchByChange}>
            <SelectTrigger className="w-full sm:w-[140px]">
              <SelectValue placeholder="Cari berdasarkan" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="nama">Nama Anak</SelectItem>
              <SelectItem value="namaAyah">Nama Ayah</SelectItem>
              <SelectItem value="namaIbu">Nama Ibu</SelectItem>
              <SelectItem value="alamat">Alamat</SelectItem>
              <SelectItem value="nomor">No. Permohonan</SelectItem>
            </SelectContent>
          </Select>
          <Input
            placeholder={`Cari berdasarkan ${
              searchBy === "nama" ? "nama anak" :
              searchBy === "namaAyah" ? "nama ayah" :
              searchBy === "namaIbu" ? "nama ibu" :
              searchBy === "alamat" ? "alamat" :
              "nomor permohonan"
            }...`}
            value={searchValue}
            onChange={(e) => setSearchValue(e.target.value)}
            className="w-full sm:w-[300px]"
          />
        </div>
        <div className="flex gap-2">
          <Select value={status || ""} onValueChange={onStatusChange}>
            <SelectTrigger className="w-full sm:w-[140px]">
              <SelectValue placeholder="Semua Status" />
            </SelectTrigger>
            <SelectContent>
              
              <SelectItem value="DIAJUKAN">Diajukan</SelectItem>
              <SelectItem value="DISETUJUI">Disetujui</SelectItem>
              <SelectItem value="DITOLAK">Ditolak</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>
      <div className="flex gap-2">
        <Button variant="outline" size="sm" onClick={onRefresh}>
          <IconRefresh className="h-4 w-4" />
        </Button>
        <Button variant="outline" size="sm" onClick={onReset}>
          Reset
        </Button>
      </div>
    </div>
  );
};
