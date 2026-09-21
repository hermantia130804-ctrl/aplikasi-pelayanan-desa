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
import { RefreshCwIcon, RotateCcwIcon, SearchIcon } from "lucide-react";
import { useQueryState } from "nuqs";
import { useEffect, useState } from "react";
import { delay } from "@/lib/utils";
import { useRouter } from "next/navigation";

export function PermohonanSKKFilterTable() {
  const router = useRouter();
  const [searchValue, setSearchValue] = useQueryState("searchValue");
  const [status, setStatus] = useQueryState("status");
  const [searchBy, setSearchBy] = useQueryState("searchBy");
  const [searchInputValue, setSearchInputValue] = useState(searchValue || "");
  
  const debouncedSearchValue = useDebounce(searchInputValue, 300);

  useEffect(() => {
    const onSearchChange = async () => {
      await delay(100);
      router.refresh();
    };
    onSearchChange();
  }, [debouncedSearchValue, router]);

  const handleStatus = async (value: string) => {
    setStatus(value);
    await delay(100);
    router.refresh();
  };

  const handleReset = async () => {
    setSearchValue(null);
    setStatus(null);
    setSearchBy(null);
    setSearchInputValue("");
    await delay(100);
    router.refresh();
  };

  const handleRefresh = () => {
    router.refresh();
  };

  return (
    <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
      <div className="flex w-full max-w-sm items-center gap-2">
        <div className="relative flex-1">
          <SearchIcon className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Cari permohonan SKK..."
            value={searchInputValue}
            onChange={(e) => setSearchInputValue(e.target.value)}
            className="pl-8"
          />
        </div>
        <Select value={searchBy || "nama"} onValueChange={setSearchBy}>
          <SelectTrigger className="w-[130px]">
            <SelectValue placeholder="Cari berdasarkan" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="nama">Nama</SelectItem>
            <SelectItem value="nik">NIK</SelectItem>
            <SelectItem value="nomorPermohonan">Nomor</SelectItem>
            <SelectItem value="alamat">Alamat</SelectItem>
          </SelectContent>
        </Select>
        <Button variant="outline" size="icon" onClick={handleReset}>
          <RotateCcwIcon className="h-4 w-4" />
        </Button>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <Select value={status || ""} onValueChange={handleStatus}>
          <SelectTrigger className="w-[130px]">
            <SelectValue placeholder="Semua Status" />
          </SelectTrigger>
          <SelectContent>
            
            <SelectItem value="DIAJUKAN">Diajukan</SelectItem>
            <SelectItem value="DISETUJUI">Disetujui</SelectItem>
            <SelectItem value="DITOLAK">Ditolak</SelectItem>
          </SelectContent>
        </Select>
        <Button variant="outline" onClick={handleRefresh}>
          <RefreshCwIcon className="mr-2 h-4 w-4" />
          Refresh
        </Button>
      </div>
    </div>
  );
}
