import { prisma } from "@/lib/prisma";
import { sendEmail } from "../utils/email";

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

  await sendEmail(
    data.user.email,
    `Update Status Permohonan ${jenis} - ${data.nomorPermohonan ?? ""}`,
    `<div style="font-family:Arial,sans-serif;max-width:600px;margin:auto;padding:20px;border:1px solid #eee;border-radius:8px;">
       <h2>📬 Update Status Permohonan ${jenis}</h2>
       <p>Kepada <b>${data.user.name}</b>,</p>
       <p>Permohonan Anda dengan nomor <b>${data.nomorPermohonan ?? "-"}</b> telah diperbarui menjadi:</p>
       <p style="font-size:18px;"><b>Status: ${statusText}</b></p>
       ${data.catatan ? `<p><b>Catatan petugas:</b> ${data.catatan}</p>` : ""}
       <p>Silakan login ke aplikasi untuk melihat detail, atau hubungi kantor desa untuk informasi lebih lanjut.</p>
       <p style="color:#888;font-size:12px;">Aplikasi Pelayanan Desa Sukamaju</p>
     </div>`
  );
  console.log(`[EMAIL] Status ${jenis} terkirim ke warga: ${data.user.email}`);
};
