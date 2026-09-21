"use client";

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { PermohonanSKTM } from "@/generated/prisma";
import {
  ColumnDef,
  flexRender,
  getCoreRowModel,
  useReactTable,
} from "@tanstack/react-table";
import { permohonanSKTMColumns } from "./permohonan-sktm-columns";
import { PermohonanSKTMPaginationTable } from "./permohonan-sktm-pagination-table";

type PermohonanSKTMDataTableProps = {
  data: PermohonanSKTM[];
  pagination: {
    total: number;
    totalPages: number;
    page: number;
    limit: number;
  };
};

export const PermohonanSKTMDataTable = ({
  data,
  pagination,
}: PermohonanSKTMDataTableProps) => {
  const columns: ColumnDef<PermohonanSKTM>[] = permohonanSKTMColumns;
  const table = useReactTable({
    data,
    columns,
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
                  colSpan={columns.length}
                  className="h-24 text-center"
                >
                  Tidak ada data permohonan SKTM.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
      <PermohonanSKTMPaginationTable pagination={pagination} />
    </div>
  );
};
