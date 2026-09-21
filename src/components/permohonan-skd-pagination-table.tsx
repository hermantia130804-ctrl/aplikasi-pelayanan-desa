"use client";

import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { useQueryState } from "nuqs";

interface PaginationProps {
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export function PermohonanSKDPaginationTable({ pagination }: PaginationProps) {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [page, setPage] = useQueryState("page", { defaultValue: "1" });

  const currentPage = pagination.page;
  const totalPages = pagination.totalPages;

  const handlePreviousPage = () => {
    if (currentPage > 1) {
      setPage((currentPage - 1).toString());
    }
  };

  const handleNextPage = () => {
    if (currentPage < totalPages) {
      setPage((currentPage + 1).toString());
    }
  };

  const handlePageClick = (pageNumber: number) => {
    setPage(pageNumber.toString());
  };

  return (
    <div className="flex items-center justify-between">
      <div className="text-sm text-muted-foreground">
        Menampilkan {Math.min((currentPage - 1) * pagination.limit + 1, pagination.total)} -{" "}
        {Math.min(currentPage * pagination.limit, pagination.total)} dari {pagination.total} data
      </div>
      <div className="flex items-center space-x-2">
        <Button
          variant="outline"
          size="sm"
          onClick={handlePreviousPage}
          disabled={currentPage <= 1}
        >
          <ChevronLeft className="h-4 w-4" />
          Sebelumnya
        </Button>
        <div className="flex items-center space-x-1">
          {Array.from({ length: totalPages }, (_, i) => i + 1)
            .filter((pageNum) => {
              return (
                pageNum === 1 ||
                pageNum === totalPages ||
                (pageNum >= currentPage - 1 && pageNum <= currentPage + 1)
              );
            })
            .map((pageNum, index, array) => (
              <div key={pageNum} className="flex items-center">
                {index > 0 && array[index - 1] !== pageNum - 1 && (
                  <span className="px-2 text-muted-foreground">...</span>
                )}
                <Button
                  variant={currentPage === pageNum ? "default" : "outline"}
                  size="sm"
                  onClick={() => handlePageClick(pageNum)}
                  className="w-8 h-8 p-0"
                >
                  {pageNum}
                </Button>
              </div>
            ))}
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={handleNextPage}
          disabled={currentPage >= totalPages}
        >
          Selanjutnya
          <ChevronRight className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}
