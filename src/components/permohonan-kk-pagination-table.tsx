"use client";

import {
  ChevronLeftIcon,
  ChevronRightIcon,
  ChevronsLeftIcon,
  ChevronsRightIcon,
} from "lucide-react";
import { parseAsInteger, useQueryState } from "nuqs";
import { Button } from "./ui/button";

type PermohonanKKPaginationTableProps = {
  pagination: {
    totalItems: number;
    totalPages: number;
  };
};

export const PermohonanKKPaginationTable = ({
  pagination,
}: PermohonanKKPaginationTableProps) => {
  const [page, setPage] = useQueryState("page", parseAsInteger.withDefault(1));

  const { totalPages } = pagination;

  const handlePageChange = (pageNumber: number) => {
    if (pageNumber < 1 || pageNumber > totalPages) return;
    setPage(pageNumber);
  };

  return (
    <div className="flex items-center justify-between px-2">
      <div className="text-sm text-muted-foreground">
        Halaman {page} dari {totalPages}
      </div>
      <div className="flex items-center space-x-2">
        <Button
          variant="outline"
          size="icon"
          onClick={() => handlePageChange(1)}
          disabled={page <= 1}
        >
          <ChevronsLeftIcon className="h-4 w-4" />
        </Button>
        <Button
          variant="outline"
          size="icon"
          onClick={() => handlePageChange(page - 1)}
          disabled={page <= 1}
        >
          <ChevronLeftIcon className="h-4 w-4" />
        </Button>
        <Button
          variant="outline"
          size="icon"
          onClick={() => handlePageChange(page + 1)}
          disabled={page >= totalPages}
        >
          <ChevronRightIcon className="h-4 w-4" />
        </Button>
        <Button
          variant="outline"
          size="icon"
          onClick={() => handlePageChange(totalPages)}
          disabled={page >= totalPages}
        >
          <ChevronsRightIcon className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
};
