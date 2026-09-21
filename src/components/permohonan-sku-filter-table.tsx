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
import { RefreshCw, Search, X } from "lucide-react";
import { useRouter } from "next/navigation";
import { useQueryState } from "nuqs";
import { useEffect, useState } from "react";

export function PermohonanSKUFilterTable() {
  const router = useRouter();
  const [searchValue, setSearchValue] = useQueryState("searchValue");
  const [searchBy, setSearchBy] = useQueryState("searchBy");
  const [status, setStatus] = useQueryState("status");
  const [localSearchValue, setLocalSearchValue] = useState(searchValue || "");

  const debouncedSetSearchValue = useDebounce(localSearchValue, 300);

  useEffect(() => {
    setSearchValue(debouncedSetSearchValue);

  }, [debouncedSetSearchValue, setSearchValue]);

  const handleReset = async () => {
    setLocalSearchValue("");
    setSearchValue(null);
    setSearchBy(null);
    setStatus(null);
    await delay(100);
    router.refresh();
  };

  const handleRefresh = async () => {
    await delay(100);
    router.refresh();
  };

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

  return (
    <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
      <div className="flex flex-1 flex-col gap-4 md:flex-row md:items-center">
        <div className="flex flex-col gap-2 md:flex-row md:items-center">
          <div className="relative flex-1 md:w-64">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Cari permohonan SKU..."
              value={localSearchValue}
              onChange={(e) => setLocalSearchValue(e.target.value)}
              className="pl-9"
            />
          </div>
          <Select value={searchBy || "nama"} onValueChange={onSearchByChange}>
            <SelectTrigger className="w-full md:w-40">
              <SelectValue placeholder="Cari berdasarkan" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="nama">Nama</SelectItem>
              <SelectItem value="nik">NIK</SelectItem>
              <SelectItem value="nomorPermohonan">Nomor Permohonan</SelectItem>
              <SelectItem value="jenisUsaha">Jenis Usaha</SelectItem>
              <SelectItem value="alamat">Alamat</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <Select value={status || ""} onValueChange={onStatusChange}>
          <SelectTrigger className="w-full md:w-40">
            <SelectValue placeholder="Semua Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="DIAJUKAN">Diajukan</SelectItem>
            <SelectItem value="DISETUJUI">Disetujui</SelectItem>
            <SelectItem value="DITOLAK">Ditolak</SelectItem>
          </SelectContent>
        </Select>
      </div>
      <div className="flex gap-2">
        <Button variant="outline" size="sm" onClick={handleReset}>
          <X className="mr-2 h-4 w-4" />
          Reset
        </Button>
        <Button variant="outline" size="sm" onClick={handleRefresh}>
          <RefreshCw className="mr-2 h-4 w-4" />
          Refresh
        </Button>
      </div>
    </div>
  );
}
