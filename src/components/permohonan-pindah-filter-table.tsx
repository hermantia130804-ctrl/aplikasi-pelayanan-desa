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
import { Search, X } from "lucide-react";
import { useRouter } from "next/navigation";
import { useQueryState } from "nuqs";
import { useEffect, useState } from "react";

export function PermohonanPindahFilterTable() {
  const router = useRouter();
  const [searchValue, setSearchValue] = useQueryState("searchValue", {
    defaultValue: "",
  });
  const [status, setStatus] = useQueryState("status", { defaultValue: "" });
  const [jenisPermohonanPindah, setJenisPermohonanPindah] = useQueryState("jenisPermohonanPindah", { defaultValue: "" });
  
  const [localSearchValue, setLocalSearchValue] = useState(searchValue);
  const debouncedSearchValue = useDebounce(localSearchValue, 500);

  useEffect(() => {
    setSearchValue(debouncedSearchValue);
  }, [debouncedSearchValue, setSearchValue]);

  const handleReset = async () => {
    setLocalSearchValue("");
    setSearchValue("");
    setStatus("");
    setJenisPermohonanPindah("");
    await delay(100);
    router.refresh();
  };

  const onSearchValueChange = async (value: string) => {
    setLocalSearchValue(value);
    setSearchValue(value);
    await delay(100);
    router.refresh();
  };

  return (
    <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
      <div className="flex flex-1 flex-col gap-4 md:flex-row md:items-center">
        <div className="relative flex-1 md:max-w-sm">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Cari permohonan pindah..."
            value={localSearchValue}
            onChange={(e) => onSearchValueChange(e.target.value)}
            className="pl-9"
          />
        </div>
        <Select value={status} onValueChange={setStatus}>
          <SelectTrigger className="w-full md:w-[180px]">
            <SelectValue placeholder="Semua Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="">Semua Status</SelectItem>
            <SelectItem value="DIAJUKAN">Diajukan</SelectItem>
            <SelectItem value="DISETUJUI">Disetujui</SelectItem>
            <SelectItem value="DITOLAK">Ditolak</SelectItem>
          </SelectContent>
        </Select>
        <Select value={jenisPermohonanPindah} onValueChange={setJenisPermohonanPindah}>
          <SelectTrigger className="w-full md:w-[200px]">
            <SelectValue placeholder="Semua Jenis" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="">Semua Jenis</SelectItem>
            <SelectItem value="SKP">Surat Keterangan Pindah</SelectItem>
            <SelectItem value="SKPLN">Surat Keterangan Pindah Luar Negeri</SelectItem>
            <SelectItem value="SKTT">Surat Keterangan Tinggal Tetap</SelectItem>
          </SelectContent>
        </Select>
      </div>
      <Button variant="outline" onClick={handleReset}>
        <X className="mr-2 h-4 w-4" />
        Reset Filter
      </Button>
    </div>
  );
}
