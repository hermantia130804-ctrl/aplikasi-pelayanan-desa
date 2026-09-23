import { NextResponse } from "next/server";
import { findCurrentSessionService } from "@/lib/server/services/session";
import { sendEmail } from "@/lib/server/utils/email";

export const dynamic = "force-dynamic";

export async function GET() {
  const session = await findCurrentSessionService();
  if (!session?.user) {
    return NextResponse.json({ error: "Belum login. Login dulu lalu buka URL ini lagi." }, { status: 401 });
  }

  const to = process.env.ADMIN_EMAIL || process.env.EMAIL_USER;
  if (!to) {
    return NextResponse.json({ error: "ADMIN_EMAIL / EMAIL_USER tidak ditemukan di environment Vercel!" }, { status: 500 });
  }

  try {
    await sendEmail(to, "Tes Email Notifikasi - Desa Sukamaju", "<p>Ini adalah email tes dari aplikasi desa. Jika Anda menerima ini, pengiriman email berfungsi.</p>");
    return NextResponse.json({ success: true, dikirimKe: to, pesan: "Email BERHASIL dikirim. Cek inbox + folder Spam email tersebut!" });
  } catch (error) {
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : String(error),
    }, { status: 500 });
  }
}
