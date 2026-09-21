"use client";

import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { useQueryState } from "nuqs";

interface PermohonanSKUPaginationTableProps {
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasNextPage: boolean;
    hasPreviousPage: boolean;
  };
}

export function PermohonanSKUPaginationTable({
  pagination,
}: PermohonanSKUPaginationTableProps) {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [page, setPage] = useQueryState("page");

  const handlePreviousPage = () => {
    if (pagination.hasPreviousPage) {
      setPage(String(pagination.page - 1));
    }
  };

  const handleNextPage = () => {
    if (pagination.hasNextPage) {
      setPage(String(pagination.page + 1));
    }
  };

  return (
    <div className="flex items-center justify-between px-2">
      <div className="flex-1 text-sm text-muted-foreground">
        Menampilkan {(pagination.page - 1) * pagination.limit + 1} -{" "}
        {Math.min(pagination.page * pagination.limit, pagination.total)} dari{" "}
        {pagination.total} permohonan SKU
      </div>
      <div className="flex items-center space-x-6 lg:space-x-8">
        <div className="flex items-center space-x-2">
          <p className="text-sm font-medium">
            Halaman {pagination.page} dari {pagination.totalPages}
          </p>
        </div>
        <div className="flex items-center space-x-2">
          <Button
            variant="outline"
            className="h-8 w-8 p-0"
            onClick={handlePreviousPage}
            disabled={!pagination.hasPreviousPage}
          >
            <span className="sr-only">Halaman sebelumnya</span>
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <Button
            variant="outline"
            className="h-8 w-8 p-0"
            onClick={handleNextPage}
            disabled={!pagination.hasNextPage}
          >
            <span className="sr-only">Halaman selanjutnya</span>
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}
