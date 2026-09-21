"use client";

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { PermohonanKTP } from "@/generated/prisma";
import {
  ColumnDef,
  flexRender,
  getCoreRowModel,
  useReactTable,
} from "@tanstack/react-table";
import { permohonanKTPColumns } from "./permohonan-ktp-columns";
import { PermohonanKTPPaginationTable } from "./permohonan-ktp-pagination-table";

type PermohonanKTPDataTableProps = {
  data: PermohonanKTP[];
  pagination: {
    totalItems: number;
    totalPages: number;
    currentPage: number;
  };
};

export const PermohonanKTPDataTable = ({
  data,
  pagination,
}: PermohonanKTPDataTableProps) => {
  const columns: ColumnDef<PermohonanKTP>[] = permohonanKTPColumns;
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
        <PermohonanKTPPaginationTable pagination={pagination} />
      </div>
    </div>
  );
};
