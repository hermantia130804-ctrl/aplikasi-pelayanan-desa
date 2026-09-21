"use client";

import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { useQueryState } from "nuqs";

interface PermohonanPindahPaginationTableProps {
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export function PermohonanPindahPaginationTable({
  pagination,
}: PermohonanPindahPaginationTableProps) {
  const [, setPage] = useQueryState("page");

  const handlePreviousPage = () => {
    if (pagination.page > 1) {
      setPage((pagination.page - 1).toString());
    }
  };

  const handleNextPage = () => {
    if (pagination.page < pagination.totalPages) {
      setPage((pagination.page + 1).toString());
    }
  };

  return (
    <div className="flex items-center justify-between">
      <div className="text-sm text-muted-foreground">
        Menampilkan {((pagination.page - 1) * pagination.limit) + 1} - {Math.min(pagination.page * pagination.limit, pagination.total)} dari {pagination.total} permohonan pindah
      </div>
      <div className="flex items-center space-x-2">
        <Button
          variant="outline"
          size="sm"
          onClick={handlePreviousPage}
          disabled={pagination.page <= 1}
        >
          <ChevronLeft className="h-4 w-4" />
          Sebelumnya
        </Button>
        <div className="text-sm font-medium">
          Halaman {pagination.page} dari {pagination.totalPages}
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={handleNextPage}
          disabled={pagination.page >= pagination.totalPages}
        >
          Selanjutnya
          <ChevronRight className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}
