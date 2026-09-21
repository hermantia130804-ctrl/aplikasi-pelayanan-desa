/* eslint-disable @typescript-eslint/no-unused-vars */
"use client";

import { delay } from "@/lib/utils"
import { FilterIcon, UserCheck2Icon, UserCog2Icon, UserIcon, UserXIcon } from "lucide-react"
import { useRouter } from "next/navigation"
import { parseAsString, useQueryState } from "nuqs"
import { Button } from "./ui/button"
import { Card, CardAction, CardDescription, CardHeader, CardTitle } from "./ui/card"

type UserCardsProps = {
 data: {
    user: number,
    admin: number,
    active: number,
    inactive: number,
 }   
}

export const UserCards = ({ data }: UserCardsProps) => {
    const router = useRouter();
    const [role, setRole] = useQueryState("role", parseAsString);
    const [status, setStatus] = useQueryState("status", parseAsString);
    const [searchBy, setSearchBy] = useQueryState("searchBy", parseAsString.withDefault("name"));
    const [searchValue, setSearchValue] = useQueryState("searchValue", parseAsString.withDefault(""));
    const [page, setPage] = useQueryState("page", parseAsString.withDefault("1"));
    const [limit, setLimit] = useQueryState("limit", parseAsString.withDefault("10"));
    const [sort, setSort] = useQueryState("sort", parseAsString.withDefault("asc"));
    const [sortColumn, setSortColumn] = useQueryState("sortColumn", parseAsString.withDefault("name"));

    const onRoleChange = async (role: string) => {
        setRole(role);
        setStatus(null);
        setSearchBy("name");
        setSearchValue("");
        setPage("1");
        setLimit("10");
        setSort("asc");
        setSortColumn("name");
        await delay(100);
        router.refresh();
    };

    const onStatusChange = async (status: string) => {
        setStatus(status);
        setRole(null);
        setSearchBy("name");
        setSearchValue("");
        setPage("1");
        setLimit("10");
        setSort("asc");
        setSortColumn("name");
        await delay(100);
        router.refresh();
    };
    
    return (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card className="@container/card">
              <CardHeader>
                <CardDescription>Total Pengguna Petugas</CardDescription>
                <div className="flex flex-row items-center gap-2">
                  <CardTitle className="text-3xl font-semibold tabular-nums @[250px]/card:text-3xl">
                    {data.admin}
                  </CardTitle>
                  <UserCog2Icon className="size-8" />
                </div>
                <CardAction>
                  <Button variant="outline" size="icon" onClick={() => onRoleChange("ADMIN")}>
                    <FilterIcon />
                  </Button>
                </CardAction>
              </CardHeader>
            </Card>
            <Card className="@container/card">
              <CardHeader>
                <CardDescription>Total Pengguna Masyarakat</CardDescription>
                <div className="flex flex-row items-center gap-2">
                  <CardTitle className="text-3xl font-semibold tabular-nums @[250px]/card:text-3xl">
                    {data.user}
                  </CardTitle>
                  <UserIcon className="size-8" />
                </div>
                <CardAction>
                  <Button variant="outline" size="icon" onClick={() => onRoleChange("USER")}>
                    <FilterIcon />
                  </Button>
                </CardAction>
              </CardHeader>
            </Card>
            <Card className="@container/card">
              <CardHeader>
                <CardDescription>Total Pengguna Aktif</CardDescription>
                <div className="flex flex-row items-center gap-2">
                  <CardTitle className="text-3xl font-semibold tabular-nums @[250px]/card:text-3xl">
                    {data.active}
                  </CardTitle>
                  <UserCheck2Icon className="size-8" />
                </div>
                <CardAction>
                  <Button variant="outline" size="icon" onClick={() => onStatusChange("ACTIVE")}>
                    <FilterIcon />
                  </Button>
                </CardAction>
              </CardHeader>
            </Card>
            <Card className="@container/card">
              <CardHeader>
                <CardDescription>Total Pengguna Nonaktif</CardDescription>
                <div className="flex flex-row items-center gap-2">
                  <CardTitle className="text-3xl font-semibold tabular-nums @[250px]/card:text-3xl">
                    {data.inactive}
                  </CardTitle>
                  <UserXIcon className="size-8" />
                </div>
                <CardAction>
                  <Button variant="outline" size="icon" onClick={() => onStatusChange("INACTIVE")}>
                    <FilterIcon />
                  </Button>
                </CardAction>
              </CardHeader>
            </Card>
          </div>
    )
}  