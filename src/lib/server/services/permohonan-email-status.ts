import { prisma } from "@/lib/prisma";
import { sendEmail } from "../utils/email";
import { escapeHtml } from "../utils/sanitize";

const STATUS_LABEL: Record<string, string> = {
  DIAJUKAN: "Menunggu Proses",
  DISETUJUI: "✅ DISETUJUI",
  DITOLAK: "❌ DITOLAK",
};

/**
 * Kirim email update status permohonan ke warga.
 * jenis: KTP | KK | SKL | SKTM | SKK | SKU | SKD | PINDAH
 */
export const kirimEmailStatusWarga = async (jenis: string, id: string) => {
  let data: {
    nomorPermohonan: string | null;
    statusPermohonan: string;
    catatan: string | null;
    user: { email: string; name: string };
  } | null = null;

  switch (jenis) {
    case "KTP":
      data = await prisma.permohonanKTP.findUnique({ where: { permohonanKtpId: id }, include: { user: true } });
      break;
    case "KK":
      data = await prisma.permohonanKK.findUnique({ where: { permohonanKKId: id }, include: { user: true } });
      break;
    case "SKL":
      data = await prisma.permohonanSKL.findUnique({ where: { permohonanSKLId: id }, include: { user: true } });
      break;
    case "SKTM":
      data = await prisma.permohonanSKTM.findUnique({ where: { permohonanSKTMId: id }, include: { user: true } });
      break;
    case "SKK":
      data = await prisma.permohonanSKK.findUnique({ where: { permohonanSKKId: id }, include: { user: true } });
      break;
    case "SKU":
      data = await prisma.permohonanSKU.findUnique({ where: { permohonanSKUId: id }, include: { user: true } });
      break;
    case "SKD":
      data = await prisma.permohonanSKD.findUnique({ where: { permohonanSKDId: id }, include: { user: true } });
      break;
    case "DESIL":
      data = await prisma.perbaikanDesil.findUnique({ where: { perbaikanDesilId: id }, include: { user: true } });
      break;
    case "PINDAH":
      data = await prisma.permohonanPindah.findUnique({ where: { permohonanPindahId: id }, include: { user: true } });
      break;
    default:
      console.error(`[EMAIL STATUS] Jenis tidak dikenal: ${jenis}`);
      return;
  }

  if (!data?.user?.email) {
    console.error(`[EMAIL STATUS] Data/user tidak ditemukan untuk ${jenis} ${id}`);
    return;
  }

  const statusText = STATUS_LABEL[data.statusPermohonan] ?? data.statusPermohonan;

  // (#8) Escape SEMUA field user-controlled sebelum disisipkan ke HTML email.
  // Tanpa ini, attacker yang set nama/catatan berisi tag <script>/<img> bisa
  // inject tracking pixel atau phishing link ke email warga.
  const nama = escapeHtml(data.user.name);
  const nomor = escapeHtml(data.nomorPermohonan ?? "");
  const catatan = escapeHtml(data.catatan);
  const statusSafe = escapeHtml(statusText);
  const jenisSafe = escapeHtml(jenis);

  await sendEmail(
    data.user.email,
    `Update Status Permohonan ${jenisSafe} - ${nomor}`,
    `<div style="font-family:Arial,sans-serif;max-width:600px;margin:auto;padding:20px;border:1px solid #eee;border-radius:8px;">
       <h2>📬 Update Status Permohonan ${jenisSafe}</h2>
       <p>Kepada <b>${nama}</b>,</p>
       <p>Permohonan Anda dengan nomor <b>${nomor || "-"}</b> telah diperbarui menjadi:</p>
       <p style="font-size:18px;"><b>Status: ${statusSafe}</b></p>
       ${catatan ? `<p><b>Catatan petugas:</b> ${catatan}</p>` : ""}
       <p>Silakan login ke aplikasi untuk melihat detail, atau hubungi kantor desa untuk informasi lebih lanjut.</p>
       <p style="color:#888;font-size:12px;">Aplikasi Pelayanan Desa Sukamaju</p>
     </div>`
  );
  console.log(`[EMAIL] Status ${jenisSafe} terkirim ke warga: ${data.user.email}`);
};
