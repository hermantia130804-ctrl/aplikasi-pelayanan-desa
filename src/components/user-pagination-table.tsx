"use client";

import { delay } from "@/lib/utils";
import { useRouter } from "next/navigation";
import { parseAsInteger, useQueryState } from "nuqs";
import { Label } from "./ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./ui/select";
import { IconChevronsLeft, IconChevronLeft, IconChevronRight, IconChevronsRight } from "@tabler/icons-react";
import { Button } from "./ui/button";

type UserPaginationTableProps = {
    pagination: {
        totalItems: number;
        totalPages: number;
    };
};

export const UserPaginationTable = ({ pagination }: UserPaginationTableProps) => {
    const router = useRouter();
    const [limit, setLimit] = useQueryState("limit", parseAsInteger.withDefault(10));
    const [page, setPage] = useQueryState("page", parseAsInteger.withDefault(1));



    const onSetLimit = async (limit: string) => {
        setLimit(Number(limit));
        setPage(1);
        await delay(100);
        router.refresh();
    };

    const onNextPage = async () => {
        setPage((prev) => prev + 1);
        await delay(100);
        router.refresh();
    };

    const onPreviousPage = async () => {
        setPage((prev) => prev - 1);
        await delay(100);
        router.refresh();
    };

    const onLastPage = async () => {
        setPage(pagination.totalPages);
        await delay(100);
        router.refresh();
    };

    const onFirstPage = async () => {
        setPage(1);
        await delay(100);
        router.refresh();
    };
    return (
        <div className="flex items-center justify-between px-4">
        <div className="text-muted-foreground hidden flex-1 text-sm lg:flex">
          {pagination.totalItems} data ditemukan.
        </div>
        <div className="flex w-full items-center gap-8 lg:w-fit">
          <div className="hidden items-center gap-2 lg:flex">
            <Label htmlFor="rows-per-page" className="text-sm font-medium">
              Baris per halaman
            </Label>
            <Select
              value={`${limit}`}
              onValueChange={onSetLimit}
            >
              <SelectTrigger size="sm" className="w-20" id="rows-per-page">
                <SelectValue
                  placeholder={`${limit}`}
                />
              </SelectTrigger>
              <SelectContent side="top">
                {[10, 20, 30, 40, 50].map((pageSize) => (
                  <SelectItem key={pageSize} value={`${pageSize}`}>
                    {pageSize}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="flex w-fit items-center justify-center text-sm font-medium">
            Halaman {page} dari{" "}
            {pagination.totalPages}
          </div>
          <div className="ml-auto flex items-center gap-2 lg:ml-0">
            <Button
              variant="outline"
              className="hidden h-8 w-8 p-0 lg:flex"
              onClick={onFirstPage}
              disabled={page <= 1}
            >
              <span className="sr-only">Go to first page</span>
              <IconChevronsLeft />
            </Button>
            <Button
              variant="outline"
              className="size-8"
              size="icon"
              onClick={onPreviousPage}
              disabled={page <= 1}
            >
              <span className="sr-only">Go to previous page</span>
              <IconChevronLeft />
            </Button>
            <Button
              variant="outline"
              className="size-8"
              size="icon"
              onClick={onNextPage}
              disabled={page >= pagination.totalPages}
            >
              <span className="sr-only">Go to next page</span>
              <IconChevronRight />
            </Button>
            <Button
              variant="outline"
              className="hidden size-8 lg:flex"
              size="icon"
              onClick={onLastPage}
              disabled={page >= pagination.totalPages}
            >
              <span className="sr-only">Go to last page</span>
              <IconChevronsRight />
            </Button>
          </div>
        </div>
      </div>
  )
}