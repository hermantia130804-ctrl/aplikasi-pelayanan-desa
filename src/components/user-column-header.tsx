import { cn, delay } from "@/lib/utils";
import { ArrowDown, ArrowUp, ChevronsUpDown } from "lucide-react";
import { useRouter } from "next/navigation";
import { useQueryState } from "nuqs";
import { Button } from "./ui/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "./ui/dropdown-menu";

type UserColumnHeaderProps = {
    accessorKey: string;
    title: string;
};

export const UserColumnHeader = ({ title, accessorKey }: UserColumnHeaderProps) => {
    const router = useRouter();

    const [orderBy, setOrderBy] = useQueryState("orderBy", {
        defaultValue: "createdAt",
    });

    const [orderDirection, setOrderDirection] = useQueryState("orderDirection", {
        defaultValue: "desc",
    });

    const onOrderDirectionChange = async (orderDirection: string) => {
        setOrderBy(accessorKey);
        setOrderDirection(orderDirection);
        await delay(100);
        router.refresh();
    };

    return (
        <div className={cn("flex items-center gap-2")}>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              size="sm"
              className="data-[state=open]:bg-accent -ml-3 h-8"
            >
              <span>{title}</span>
              {orderBy === accessorKey && orderDirection === "desc" ? (
                <ArrowDown />
              ) : orderBy === accessorKey && orderDirection === "asc" ? (
                <ArrowUp />
              ) : (
                <ChevronsUpDown />
              )}
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start">
            <DropdownMenuItem onClick={() => onOrderDirectionChange("asc")}>
              <ArrowUp />
              Asc
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => onOrderDirectionChange("desc")}>
              <ArrowDown />
              Desc
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    );
};