import { cn, delay } from "@/lib/utils";
import { ArrowDown, ArrowUp, ChevronsUpDown } from "lucide-react";
import { useRouter } from "next/navigation";
import { useQueryState } from "nuqs";
import { Button } from "./ui/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "./ui/dropdown-menu";

type PermohonanSKTMColumnHeaderProps = {
    accessorKey: string;
    title: string;
};

export const PermohonanSKTMColumnHeader = ({ title, accessorKey }: PermohonanSKTMColumnHeaderProps) => {
    const router = useRouter();

    const [orderField, setOrderField] = useQueryState("orderField", {
        defaultValue: "createdAt",
    });

    const [orderDirection, setOrderDirection] = useQueryState("orderDirection", {
        defaultValue: "desc",
    });

    const onOrderDirectionChange = async (orderDirection: string) => {
        setOrderField(accessorKey);
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
              className="-ml-3 h-8 data-[state=open]:bg-accent"
            >
              <span>{title}</span>
              {orderField === accessorKey && orderDirection === "desc" ? (
                <ArrowDown className="ml-2 h-4 w-4" />
              ) : orderField === accessorKey && orderDirection === "asc" ? (
                <ArrowUp className="ml-2 h-4 w-4" />
              ) : (
                <ChevronsUpDown className="ml-2 h-4 w-4" />
              )}
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start">
            <DropdownMenuItem onClick={() => onOrderDirectionChange("asc")}>
              <ArrowUp className="mr-2 h-3.5 w-3.5 text-muted-foreground/70" />
              Asc
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => onOrderDirectionChange("desc")}>
              <ArrowDown className="mr-2 h-3.5 w-3.5 text-muted-foreground/70" />
              Desc
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    );
};
