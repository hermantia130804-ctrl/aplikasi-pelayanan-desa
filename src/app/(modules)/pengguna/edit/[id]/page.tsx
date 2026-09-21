import { Button } from "@/components/ui/button";
import { UserUpdateForm } from "@/components/user-update-form";
import { PATHS } from "@/constants/paths";
import { findUserData } from "@/lib/server/data/user";
import Link from "next/link";

interface UserUpdatePageProps {
  params: Promise<{ id: string }>;
}

export default async function UserUpdatePage({ params }: UserUpdatePageProps) {
  const { data } = await findUserData(params);
  return (
    <div className="flex flex-1 flex-col">
      <div className="@container/main flex flex-1 flex-col gap-2">
        <div className="flex flex-col gap-4 py-4 md:gap-6 md:py-6 px-4 lg:px-6">
          <div className="flex flex-row justify-between">
            <div className="flex flex-col gap-2">
              <h1 className="text-2xl font-bold">Ubah Pengguna</h1>
              <p className="text-muted-foreground">
                Ubah Pengguna adalah fitur untuk mengubah pengguna di aplikasi pelayanan desa Sukamaju.
              </p>
            </div>
            <Button asChild>
              <Link href={PATHS.USER}>Kembali</Link>
            </Button>
          </div>
          <UserUpdateForm data={data} />
        </div>
      </div>
    </div>
  )
}

