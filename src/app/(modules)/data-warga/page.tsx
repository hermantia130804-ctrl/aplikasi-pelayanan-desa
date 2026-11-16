import { findCurrentSessionService } from "@/lib/server/services/session";
import { prisma } from "@/lib/prisma";
import { getStatistikDataWarga } from "@/lib/server/actions/statistik-data-warga";
import DataWargaShell, { type StatistikBeranda } from "@/components/data-warga-shell";
import { redirect } from "next/navigation";

export const dynamic = "force-dynamic";

export default async function DataWargaPage() {
    const session = await findCurrentSessionService();
    if (!session?.user) redirect("/masuk");

    const meDoc = await prisma.user.findUnique({
      where: { userId: session.user.userId },
      select: { noRt: true, noRw: true, namaKetua: true },
    });
    const rtInfo = { namaRT: meDoc?.noRt || "001", rw: meDoc?.noRw || "002", kelurahan: "SUKAMAJU", kecamatan: "CIBUNGBULANG", kabupaten: "BOGOR", provinsi: "JAWA BARAT", ketuaRT: meDoc?.namaKetua || null };
    const isStaff = session.user.role === "ADMIN" || session.user.role === "PETUGAS";

    // Statistik awal (tanpa filter). Shell akan re-fetch saat admin memilih RT/RW tertentu.
    const statistik = await getStatistikDataWarga();
    if (!statistik) redirect("/masuk");

    const user = {
      name: session.user.name,
      noRt: meDoc?.noRt ?? null,
      noRw: meDoc?.noRw ?? null,
      namaKetua: meDoc?.namaKetua ?? null,
    };

    return (
        <DataWargaShell
            isStaff={isStaff}
            initialStatistik={statistik as StatistikBeranda}
            user={user}
            rtInfo={rtInfo}
        />
    );
}
