import { PermohonanKTPDetail } from "@/components/permohonan-ktp-detail";
import { findPermohonanKTPData } from "@/lib/server/data/permohonan-ktp";
import { requireAdminPage } from "@/lib/server/guards";
import { redirect } from "next/navigation";

interface DetailPermohonanKTPPageProps {
  params: Promise<{ id: string }>;
}

export default async function DetailPermohonanKTPPage({ params }: DetailPermohonanKTPPageProps) {
  const session = await requireAdminPage();
  const { data } = await findPermohonanKTPData(params);

  // Warga hanya boleh melihat permohonan miliknya sendiri; admin & petugas boleh semua
  if (session.user.role === "USER" && data.userId !== session.user.userId) {
    redirect("/permohonan-saya");
  }

  return (
    <div className="flex flex-1 flex-col">
      <div className="@container/main flex flex-1 flex-col gap-2">
        <div className="flex flex-col gap-4 py-4 md:gap-6 md:py-6 px-4 lg:px-6">
          <div className="flex flex-row justify-between">
            <div className="flex flex-col gap-2">
              <h1 className="text-2xl font-bold">Kelola Permohonan KTP</h1>
              <p className="text-muted-foreground">
                Kelola Permohonan KTP adalah fitur untuk mengelola permohonan KTP yang terdaftar di aplikasi pelayanan desa Sukamaju.
              </p>
            </div>
          </div>
          <PermohonanKTPDetail permohonanKTP={data} />
        </div>
      </div>
    </div>
  );
}
