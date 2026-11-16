import { prisma } from "@/lib/prisma";
import { findCurrentSessionService } from "@/lib/server/services/session";
import { redirect } from "next/navigation";
import { PATHS } from "@/constants/paths";
import { deleteSessionTokenCookie } from "@/lib/server/utils/session";

// Keamanan (#15): cek tidak hanya role, tapi juga status === ACTIVE dan
// verifiedAt !== null. Tanpa ini, user INACTIVE (mis. di-nonaktifkan admin
// setelah insiden) atau user belum verifikasi email tetap bisa membuka
// halaman admin selama cookie session valid. Jika gagal, bersihkan cookie
// agar middleware tidak terus mengizinkan akses berdasarkan cookie basi.
const requireStaffPage = async (requireFullAdmin: boolean) => {
  const session = await findCurrentSessionService();
  if (!session?.user) {
    redirect(PATHS.SIGN_IN);
  }
  const user = await prisma.user.findUnique({ where: { userId: session.user.userId } });
  if (!user || user.status !== "ACTIVE" || !user.verifiedAt) {
    // Akun tidak aktif / belum verifikasi → blokir & bersihkan cookie.
    await deleteSessionTokenCookie();
    redirect(PATHS.SIGN_IN);
  }
  const ok = requireFullAdmin
    ? user.role === "ADMIN"
    : user.role === "ADMIN" || user.role === "PETUGAS";
  if (!ok) redirect("/dashboard");
  return session;
};

export const requireAdminPage = async () => requireStaffPage(false);

// Khusus aksi berbahaya (hapus/kelola pengguna): tetap admin penuh
export const requireFullAdminPage = async () => requireStaffPage(true);
