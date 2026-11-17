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
      select: { noRt: true, noRw: true, namaKetua: true, jabatan: true },
    });
    const rtInfo = { namaRT: meDoc?.noRt || "001", rw: meDoc?.noRw || "002", kelurahan: "SUKAMAJU", kecamatan: "CIBUNGBULANG", kabupaten: "BOGOR", provinsi: "JAWA BARAT", ketuaRT: meDoc?.namaKetua || null };
    const role = session.user.role;
    const isStaff = role === "ADMIN" || role === "PETUGAS";
    // ADMIN saja: berhak hapus semua data (tombol Reset Data).
    const isAdmin = role === "ADMIN";
    // ADMIN & RT: boleh kelola data warga — fitur SAMA PERSIS dengan admin.
    //   Bedanya hanya: (1) filter wilayah tidak tampil utk RT (auto-scoped), (2) RT hanya lihat/kelola RT sendiri (di-lock server).
    //   Petugas lain (termasuk Kasi) saat ini read-only (lihat data saja) — demi keamanan tombol Hapus Semua.
    const canAdd = role === "ADMIN" || role === "RT";

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
            isAdmin={isAdmin}
            canAdd={canAdd}
            initialStatistik={statistik as StatistikBeranda}
            user={user}
            rtInfo={rtInfo}
        />
    );
}
