import { Button } from "@/components/ui/button";
import { PATHS } from "@/constants/paths";
import Link from "next/link";
import { findUserData } from "@/lib/server/data/user";
import { UserDetailForm } from "@/components/user-detail-form";

interface UserDetailPageProps {
  params: Promise<{ id: string }>;
}

export default async function UserDetailPage({ params }: UserDetailPageProps) {
  const { data } = await findUserData(params);
  return (
    <div className="flex flex-1 flex-col">
      <div className="@container/main flex flex-1 flex-col gap-2">
        <div className="flex flex-col gap-4 py-4 md:gap-6 md:py-6 px-4 lg:px-6">
          <div className="flex flex-row justify-between">
            <div className="flex flex-col gap-2">
              <h1 className="text-2xl font-bold">Detail Pengguna</h1>
              <p className="text-muted-foreground">
                Detail Pengguna adalah fitur untuk melihat detail pengguna di aplikasi pelayanan desa Sukamaju.
              </p>
            </div>
            <Button asChild>
              <Link href={PATHS.USER}>Kembali</Link>
            </Button>
          </div>
          <UserDetailForm data={data} />
        </div>
      </div>
    </div>
  )
}

