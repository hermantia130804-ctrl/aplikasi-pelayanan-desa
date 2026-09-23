"use client";

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { PermohonanKK } from "@/generated/prisma";
import {
  ColumnDef,
  flexRender,
  getCoreRowModel,
  useReactTable,
} from "@tanstack/react-table";
import { permohonanKKColumns } from "./permohonan-kk-columns";
import { PermohonanKKPaginationTable } from "./permohonan-kk-pagination-table";

type PermohonanKKDataTableProps = {
  data: PermohonanKK[];
  pagination: {
    totalItems: number;
    totalPages: number;
    currentPage: number;
  };
};

export const PermohonanKKDataTable = ({
  data,
  pagination,
}: PermohonanKKDataTableProps) => {
  const columns: ColumnDef<PermohonanKK>[] = permohonanKKColumns;
  const table = useReactTable({
    data,
    columns,
    getCoreRowModel: getCoreRowModel(),
  });

  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader className="bg-muted sticky top-0 z-10">
          {table.getHeaderGroups().map((headerGroup) => (
            <TableRow key={headerGroup.id}>
              {headerGroup.headers.map((header) => (
                <TableHead key={header.id}>
                  {header.isPlaceholder
                    ? null
                    : flexRender(
                        header.column.columnDef.header,
                        header.getContext()
                      )}
                </TableHead>
              ))}
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
                    {flexRender(cell.column.columnDef.cell, cell.getContext())}
                  </TableCell>
                ))}
              </TableRow>
            ))
          ) : (
            <TableRow>
              <TableCell
                colSpan={columns.length}
                className="h-24 text-center"
              >
                Tidak ada data
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
      <div className="py-2">
        <PermohonanKKPaginationTable pagination={pagination} />
      </div>
    </div>
  );
};
