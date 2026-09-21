import { Skeleton } from "@/components/ui/skeleton";

export default function KTPRequestLoading() {
  return (
    <div className="flex flex-1 flex-col">
      <div className="@container/main flex flex-1 flex-col gap-2">
        <div className="flex flex-col gap-4 py-4 md:gap-6 md:py-6 px-4 lg:px-6">
          <div className="flex flex-col gap-2">
            <Skeleton className="h-8 w-[250px]" />
            <Skeleton className="h-4 w-[350px]" />
          </div>

          <div className="flex flex-col gap-4">
            <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
              <div className="flex w-full max-w-sm items-center gap-2">
                <Skeleton className="h-9 w-full" />
                <Skeleton className="h-9 w-[130px]" />
                <Skeleton className="h-9 w-9" />
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <Skeleton className="h-9 w-[130px]" />
                <Skeleton className="h-9 w-[130px]" />
                <Skeleton className="h-9 w-[80px]" />
                <Skeleton className="h-9 w-[100px]" />
              </div>
            </div>

            <div className="rounded-md border">
              <div className="relative w-full overflow-auto">
                <table className="w-full caption-bottom text-sm">
                  <thead className="[&_tr]:border-b">
                    <tr className="border-b transition-colors hover:bg-muted/50 data-[state=selected]:bg-muted">
                      <th className="h-12 px-4 text-left align-middle font-medium">
                        <Skeleton className="h-4 w-[70px]" />
                      </th>
                      <th className="h-12 px-4 text-left align-middle font-medium">
                        <Skeleton className="h-4 w-[70px]" />
                      </th>
                      <th className="h-12 px-4 text-left align-middle font-medium">
                        <Skeleton className="h-4 w-[100px]" />
                      </th>
                      <th className="h-12 px-4 text-left align-middle font-medium">
                        <Skeleton className="h-4 w-[70px]" />
                      </th>
                      <th className="h-12 px-4 text-left align-middle font-medium">
                        <Skeleton className="h-4 w-[70px]" />
                      </th>
                      <th className="h-12 px-4 text-left align-middle font-medium">
                        <Skeleton className="h-4 w-[70px]" />
                      </th>
                      <th className="h-12 px-4 text-left align-middle font-medium">
                        <Skeleton className="h-4 w-[70px]" />
                      </th>
                    </tr>
                  </thead>
                  <tbody className="[&_tr:last-child]:border-0">
                    {Array.from({ length: 5 }).map((_, index) => (
                      <tr
                        key={index}
                        className="border-b transition-colors hover:bg-muted/50 data-[state=selected]:bg-muted"
                      >
                        <td className="p-4 align-middle">
                          <Skeleton className="h-4 w-[120px]" />
                        </td>
                        <td className="p-4 align-middle">
                          <Skeleton className="h-4 w-[150px]" />
                        </td>
                        <td className="p-4 align-middle">
                          <Skeleton className="h-4 w-[200px]" />
                        </td>
                        <td className="p-4 align-middle">
                          <Skeleton className="h-4 w-[80px]" />
                        </td>
                        <td className="p-4 align-middle">
                          <Skeleton className="h-6 w-[80px] rounded-full" />
                        </td>
                        <td className="p-4 align-middle">
                          <Skeleton className="h-4 w-[100px]" />
                        </td>
                        <td className="p-4 align-middle">
                          <div className="flex items-center gap-2">
                            <Skeleton className="h-8 w-8" />
                            <Skeleton className="h-8 w-8" />
                            <Skeleton className="h-8 w-8" />
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            <div className="flex items-center justify-between px-2">
              <Skeleton className="h-4 w-[150px]" />
              <div className="flex items-center space-x-2">
                <Skeleton className="h-8 w-8" />
                <Skeleton className="h-8 w-8" />
                <Skeleton className="h-8 w-8" />
                <Skeleton className="h-8 w-8" />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
