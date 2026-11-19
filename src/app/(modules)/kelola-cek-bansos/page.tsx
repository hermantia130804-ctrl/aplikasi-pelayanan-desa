import { Badge } from "@/components/ui/badge";
import { findManyCekBansosAction } from "@/lib/server/actions/cek-bansos";
import { CekBansosDeleteModal } from "@/components/cek-bansos-delete-modal";
import Link from "next/link";
import moment from "moment";

export const dynamic = "force-dynamic";

const badgeVarian: Record<string, "default" | "secondary" | "destructive" | "outline"> = {
  DIAJUKAN: "secondary",
  SELESAI: "default",
  DITOLAK: "destructive",
};

export default async function KelolaCekBansosPage() {
  const res = await findManyCekBansosAction();
  const daftar = "data" in res ? res.data : [];

  return (
    <div className="flex flex-1 flex-col">
      <div className="@container/main flex flex-1 flex-col gap-2">
        <div className="flex flex-col gap-4 py-4 md:gap-6 md:py-6 px-4 lg:px-6">
          <div className="flex flex-col gap-2">
            <h1 className="text-2xl font-bold">Kelola Status Cek Bansos</h1>
            <p className="text-muted-foreground">Daftar pengajuan cek kelayakan bansos dari warga.</p>
          </div>

          {daftar.length === 0 ? (
            <div className="rounded-xl border border-dashed py-16 text-center text-muted-foreground">
              Belum ada pengajuan warga.
            </div>
          ) : (
            <div className="flex flex-col gap-3">
              {daftar.map((d) => (
                <div
                  key={d.cekBansosId}
                  className="flex flex-col gap-2 rounded-xl border bg-card p-4 shadow-sm transition-colors hover:bg-muted/40 sm:flex-row sm:items-center sm:justify-between"
                >
                  <Link
                    href={"/kelola-cek-bansos/" + d.cekBansosId}
                    className="flex flex-1 items-center justify-between gap-2"
                  >
                    <div>
                      <p className="font-bold">{d.nomorPermohonan}</p>
                      <p className="text-sm text-muted-foreground">
                        KK a.n. {d.namaKepalaKeluarga} · NIK {d.nik} · Pengaju: {d.user?.name ?? "-"} · {moment(d.createdAt).format("DD MMM YYYY")}
                      </p>
                    </div>
                    <Badge variant={badgeVarian[d.statusPermohonan] ?? "outline"}>
                      {d.statusPermohonan}
                    </Badge>
                  </Link>
                  <CekBansosDeleteModal cekBansosId={d.cekBansosId} />
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
