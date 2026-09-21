"use client";

import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Column } from "@tanstack/react-table";
import { ArrowUpDown, ChevronDown, ChevronUp } from "lucide-react";
import { useQueryState } from "nuqs";

interface PermohonanPindahColumnHeaderProps<TData, TValue> {
  column: Column<TData, TValue>;
  title: string;
}

export function PermohonanPindahColumnHeader<TData, TValue>({
  column,
  title,
}: PermohonanPindahColumnHeaderProps<TData, TValue>) {
  const [, setOrderField] = useQueryState("orderField");
  const [, setOrderDirection] = useQueryState("orderDirection");

  const handleSort = (direction: "asc" | "desc") => {
    setOrderField(column.id);
    setOrderDirection(direction);
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="sm"
          className="-ml-3 h-8 data-[state=open]:bg-accent"
        >
          <span>{title}</span>
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start">
        <DropdownMenuItem onClick={() => handleSort("asc")}>
          <ChevronUp className="mr-2 h-4 w-4" />
          Ascending
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => handleSort("desc")}>
          <ChevronDown className="mr-2 h-4 w-4" />
          Descending
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
