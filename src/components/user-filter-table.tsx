"use client";

import { useDebounce } from "@/hooks/use-debounce";
import { delay } from "@/lib/utils";
import { useRouter } from "next/navigation";
import { parseAsString, useQueryState } from "nuqs";
import { useEffect } from "react";
import { Input } from "./ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./ui/select";
import { IconRefresh } from "@tabler/icons-react";
import { Button } from "./ui/button";

export const UserFilterTable = () => {
  const router = useRouter();

  const [role, setRole] = useQueryState("role", parseAsString);
  const [status, setStatus] = useQueryState("status", parseAsString);
  const [searchBy, setSearchBy] = useQueryState("searchBy", parseAsString.withDefault("name"));
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

  const onRoleChange = async (value: string) => {
    setRole(value);
    await delay(100);
    router.refresh();
  };

  const onReset = async () => {
    setRole(null);
    setStatus(null);
    setSearchBy("name");
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
          <SelectItem value="name">Nama</SelectItem>
          <SelectItem value="email">Email</SelectItem>
          <SelectItem value="nik">NIK</SelectItem>
          <SelectItem value="phone">No. Telp</SelectItem>
          <SelectItem value="address">Alamat</SelectItem>
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
          <SelectItem value="ACTIVE">Aktif</SelectItem>
          <SelectItem value="INACTIVE">Tidak Aktif</SelectItem>
        </SelectContent>
      </Select>
      <Select
        value={role || "-"}
        onValueChange={onRoleChange}
      >
        <SelectTrigger>
          <SelectValue placeholder="Peran" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem disabled value="-">Peran</SelectItem>
          <SelectItem value="ADMIN">Admin Full Control</SelectItem>
          <SelectItem value="PETUGAS">Petugas</SelectItem>
          <SelectItem value="USER">Masyarakat</SelectItem>
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
