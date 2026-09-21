import { Button } from "@/components/ui/button";
import { UserCards } from "@/components/user-cards";
import { UserDataTable } from "@/components/user-data-table";
import { UserFilterTable } from "@/components/user-filter-table";
import { PATHS } from "@/constants/paths";
import { findManyUserData, findUserCountData } from "@/lib/server/data/user";
import { delay } from "@/lib/utils";
import Link from "next/link";

interface UserPageProps {
  searchParams: Promise<{ [key: string]: string }>;
}

export default async function UserPage({ searchParams }: UserPageProps) {
  const { data: countData } = await findUserCountData();
  const { data, pagination } = await findManyUserData(searchParams);
  await delay(1000);
  return (
    <div className="flex flex-1 flex-col">
      <div className="@container/main flex flex-1 flex-col gap-2">
        <div className="flex flex-col gap-4 py-4 md:gap-6 md:py-6 px-4 lg:px-6">
          <div className="flex flex-row justify-between">
            <div className="flex flex-col gap-2">
              <h1 className="text-2xl font-bold">Kelola Pengguna</h1>
              <p className="text-muted-foreground">
                Kelola Pengguna adalah fitur untuk mengelola pengguna yang terdaftar di aplikasi pelayanan desa Sukamaju.
              </p>
            </div>
            <Button asChild>
              <Link href={PATHS.USER_CREATE}>Tambah Pengguna</Link>
            </Button>
          </div>
          <UserCards data={countData} />
          <UserFilterTable />
          <UserDataTable data={data} pagination={pagination} />
        </div>
      </div>
    </div>
  );
}

