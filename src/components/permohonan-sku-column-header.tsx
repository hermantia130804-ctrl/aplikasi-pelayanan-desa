"use client";

import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { orderFieldSKUEnum } from "@/lib/validators/permohonan-sku";
import { Column } from "@tanstack/react-table";
import { ArrowDown, ArrowUp, ArrowUpDown } from "lucide-react";
import { useQueryState } from "nuqs";

interface PermohonanSKUColumnHeaderProps<TData, TValue> {
  column: Column<TData, TValue>;
  title: string;
}

export function PermohonanSKUColumnHeader<TData, TValue>({
  column,
  title,
}: PermohonanSKUColumnHeaderProps<TData, TValue>) {
  const [orderField, setOrderField] = useQueryState("orderField");
  const [orderDirection, setOrderDirection] = useQueryState("orderDirection");

  const handleSort = (field: string, direction: "asc" | "desc") => {
    setOrderField(field);
    setOrderDirection(direction);
  };

  const isValidOrderField = (field: string): boolean => {
    return orderFieldSKUEnum.safeParse(field).success;
  };

  const columnId = column.id;
  const isCurrentField = orderField === columnId;
  const currentDirection = orderDirection as "asc" | "desc";

  if (!isValidOrderField(columnId)) {
    return <div className="font-medium">{title}</div>;
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="sm" className="h-8 data-[state=open]:bg-accent">
          <span>{title}</span>
          {isCurrentField ? (
            currentDirection === "desc" ? (
              <ArrowDown className="ml-2 h-4 w-4" />
            ) : (
              <ArrowUp className="ml-2 h-4 w-4" />
            )
          ) : (
            <ArrowUpDown className="ml-2 h-4 w-4" />
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start">
        <DropdownMenuItem onClick={() => handleSort(columnId, "asc")}>
          <ArrowUp className="mr-2 h-3.5 w-3.5 text-muted-foreground/70" />
          Asc
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => handleSort(columnId, "desc")}>
          <ArrowDown className="mr-2 h-3.5 w-3.5 text-muted-foreground/70" />
          Desc
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
