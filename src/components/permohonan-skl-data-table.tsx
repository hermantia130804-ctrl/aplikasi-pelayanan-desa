"use client";

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { PermohonanSKL } from "@/generated/prisma";
import {
  ColumnDef,
  flexRender,
  getCoreRowModel,
  useReactTable,
} from "@tanstack/react-table";
import { permohonanSKLColumns } from "./permohonan-skl-columns";
import { PermohonanSKLPaginationTable } from "./permohonan-skl-pagination-table";

type PermohonanSKLDataTableProps = {
  data: PermohonanSKL[];
  pagination: {
    totalItems: number;
    totalPages: number;
    currentPage: number;
  };
};

export const PermohonanSKLDataTable = ({
  data,
  pagination,
}: PermohonanSKLDataTableProps) => {
  const columns: ColumnDef<PermohonanSKL>[] = permohonanSKLColumns;
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
              <TableCell colSpan={columns.length} className="h-24 text-center">
                Tidak ada data permohonan SKL.
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
      <PermohonanSKLPaginationTable pagination={pagination} />
    </div>
  );
};
