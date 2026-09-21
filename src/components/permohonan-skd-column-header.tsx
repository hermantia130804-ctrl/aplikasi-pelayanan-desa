"use client";

import { Column } from "@tanstack/react-table";
import { ArrowUpDown, ArrowUp, ArrowDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useQueryState } from "nuqs";

interface PermohonanSKDColumnHeaderProps<TData, TValue> {
  column: Column<TData, TValue>;
  title: string;
}

export function PermohonanSKDColumnHeader<TData, TValue>({
  column,
  title,
}: PermohonanSKDColumnHeaderProps<TData, TValue>) {
  const [orderField, setOrderField] = useQueryState("orderField", { defaultValue: "createdAt" });
  const [orderDirection, setOrderDirection] = useQueryState("orderDirection", { defaultValue: "desc" });

  const handleSort = (direction: "asc" | "desc") => {
    setOrderField(column.id);
    setOrderDirection(direction);
  };

  const getSortIcon = () => {
    if (orderField !== column.id) return <ArrowUpDown className="ml-2 h-4 w-4" />;
    if (orderDirection === "asc") return <ArrowUp className="ml-2 h-4 w-4" />;
    return <ArrowDown className="ml-2 h-4 w-4" />;
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="sm" className="-ml-3 h-8 data-[state=open]:bg-accent">
          <span>{title}</span>
          {getSortIcon()}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start">
        <DropdownMenuItem onClick={() => handleSort("asc")}>
          <ArrowUp className="mr-2 h-3.5 w-3.5 text-muted-foreground/70" />
          Asc
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => handleSort("desc")}>
          <ArrowDown className="mr-2 h-3.5 w-3.5 text-muted-foreground/70" />
          Desc
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
