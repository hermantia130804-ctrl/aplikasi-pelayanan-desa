"use client";

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { PermohonanSKKPaginationTable } from "@/components/permohonan-skk-pagination-table";
import { permohonanSKKColumns } from "@/components/permohonan-skk-columns";
import { PermohonanSKK } from "@/generated/prisma";
import {
  flexRender,
  getCoreRowModel,
  useReactTable,
} from "@tanstack/react-table";

interface PermohonanSKKDataTableProps {
  data: PermohonanSKK[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasNextPage: boolean;
    hasPreviousPage: boolean;
  };
}

export function PermohonanSKKDataTable({
  data,
  pagination,
}: PermohonanSKKDataTableProps) {
  const table = useReactTable({
    data,
    columns: permohonanSKKColumns,
    getCoreRowModel: getCoreRowModel(),
  });

  return (
    <div className="space-y-4">
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id}>
                {headerGroup.headers.map((header) => {
                  return (
                    <TableHead key={header.id}>
                      {header.isPlaceholder
                        ? null
                        : flexRender(
                            header.column.columnDef.header,
                            header.getContext()
                          )}
                    </TableHead>
                  );
                })}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {table.getRowModel().rows?.length ? (
              table.getRowModel().rows.map((row) => (
                <TableRow
                  key={row.id}
                  data-state={row.getIsSelected() && "selected"}
                >
                  {row.getVisibleCells().map((cell) => (
                    <TableCell key={cell.id}>
                      {flexRender(
                        cell.column.columnDef.cell,
                        cell.getContext()
                      )}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell
                  colSpan={permohonanSKKColumns.length}
                  className="h-24 text-center"
                >
                  Tidak ada data permohonan SKK.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
      <PermohonanSKKPaginationTable pagination={pagination} />
    </div>
  );
}
