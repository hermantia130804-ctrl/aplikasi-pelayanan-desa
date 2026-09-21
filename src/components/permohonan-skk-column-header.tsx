"use client";

import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Column } from "@tanstack/react-table";
import { ArrowUpDownIcon, ArrowUpIcon, ArrowDownIcon } from "lucide-react";
import { useQueryState } from "nuqs";

interface PermohonanSKKColumnHeaderProps<TData, TValue> {
  column: Column<TData, TValue>;
  title: string;
}

export function PermohonanSKKColumnHeader<TData, TValue>({
  column,
  title,
}: PermohonanSKKColumnHeaderProps<TData, TValue>) {
  const [orderField, setOrderField] = useQueryState("orderField");
  const [orderDirection, setOrderDirection] = useQueryState("orderDirection");

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
          {orderField === column.id && orderDirection === "desc" ? (
            <ArrowDownIcon className="ml-2 h-4 w-4" />
          ) : orderField === column.id && orderDirection === "asc" ? (
            <ArrowUpIcon className="ml-2 h-4 w-4" />
          ) : (
            <ArrowUpDownIcon className="ml-2 h-4 w-4" />
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start">
        <DropdownMenuItem onClick={() => handleSort("asc")}>
          <ArrowUpIcon className="mr-2 h-3.5 w-3.5 text-muted-foreground/70" />
          Asc
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => handleSort("desc")}>
          <ArrowDownIcon className="mr-2 h-3.5 w-3.5 text-muted-foreground/70" />
          Desc
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
