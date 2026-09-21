import { Button } from "@/components/ui/button";
import { UserCreateForm } from "@/components/user-create-form";
import { PATHS } from "@/constants/paths";
import Link from "next/link";

export default async function UserCreatePage() {

  return (
    <div className="flex flex-1 flex-col">
      <div className="@container/main flex flex-1 flex-col gap-2">
        <div className="flex flex-col gap-4 py-4 md:gap-6 md:py-6 px-4 lg:px-6">
          <div className="flex flex-row justify-between">
            <div className="flex flex-col gap-2">
              <h1 className="text-2xl font-bold">Tambah Pengguna</h1>
              <p className="text-muted-foreground">
                Tambah Pengguna adalah fitur untuk menambahkan pengguna baru di aplikasi pelayanan desa Sukamaju.
              </p>
            </div>
            <Button asChild>
              <Link href={PATHS.USER}>Kembali</Link>
            </Button>
          </div>
          <UserCreateForm />
        </div>
      </div>
    </div>
  )
}

