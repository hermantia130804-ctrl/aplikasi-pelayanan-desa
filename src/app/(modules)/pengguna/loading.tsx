import { Skeleton } from "@/components/ui/skeleton";

export default function UserLoading() {
    return (
        <div className="flex flex-1 flex-col">
            <div className="@container/main flex flex-1 flex-col gap-2">
                <div className="flex flex-col gap-4 py-4 md:gap-6 md:py-6 px-4 lg:px-6">
                    <div className="flex flex-row justify-between">
                        <div className="flex flex-col gap-2">
                            <Skeleton className="h-10 w-52 rounded-md" />
                            <Skeleton className="h-10 w-96 rounded-md" />
                        </div>
                        <Skeleton className="h-10 w-24 rounded-md" />
                    </div>
                    <div className="grid grid-cols-4 gap-4">
                        <Skeleton className="h-24 w-full rounded-md" />
                        <Skeleton className="h-24 w-full rounded-md" />
                        <Skeleton className="h-24 w-full rounded-md" />
                        <Skeleton className="h-24 w-full rounded-md" />
                    </div>
                    <div className="flex flex-col gap-2">
                        {Array.from({ length: 5 }).map((_, index) => (
                            <Skeleton key={index} className="h-10 w-full rounded-md" />
                        ))}
                    </div>
                </div>
            </div>
        </div>

    )
} 