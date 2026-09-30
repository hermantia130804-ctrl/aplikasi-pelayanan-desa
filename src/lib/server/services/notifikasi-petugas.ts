import { prisma } from "@/lib/prisma";
import { sendEmail } from "../utils/email";
import { kirimWa } from "./whatsapp";
import { TUGAS_JABATAN } from "@/constants/jabatan";

const STATUS_LABEL: Record<string, string> = {
  DIAJUKAN: "Menunggu Proses",
  DISETUJUI: "✅ DISETUJUI",
  DITOLAK: "❌ DITOLAK",
};

const pesanWa = (jenis: string, d: { nomor?: string; nama?: string; alasan?: string; pengaju?: string }) =>
  `📢 *PERMOHONAN ${jenis} BARU*\n\n` +
  (d.nomor ? `🧾 No: ${d.nomor}\n` : "") +
  `👤 Nama: ${d.nama ?? "-"}\n` +
  (d.alasan ? `📌 Perihal: ${d.alasan}\n` : "") +
  (d.pengaju ? `🌐 Pengaju: ${d.pengaju}\n` : "") +
  `\nSilakan proses melalui menu Kelola ${jenis} di aplikasi.\n` +
  `_Aplikasi Pelayanan Desa Sukamaju_`;

const htmlEmail = (jenis: string, d: { nomor?: string; nama?: string; alasan?: string; pengaju?: string }) =>
  `<div style="font-family:Arial,sans-serif;max-width:600px;margin:auto;padding:20px;border:1px solid #eee;border-radius:8px;">
     <h2>📬 Permohonan ${jenis} Baru</h2>
     <ul>
       ${d.nomor ? `<li><b>No. Permohonan:</b> ${d.nomor}</li>` : ""}
       <li><b>Nama:</b> ${d.nama ?? "-"}</li>
       ${d.alasan ? `<li><b>Perihal:</b> ${d.alasan}</li>` : ""}
       ${d.pengaju ? `<li><b>Pengaju:</b> ${d.pengaju}</li>` : ""}
     </ul>
     <p>Silakan proses melalui menu <b>Kelola ${jenis}</b> di aplikasi.</p>
   </div>`;

/**
 * Notifikasi lengkap ke semua PETUGAS & ADMIN (dari database):
 * EMAIL + WHATSAPP untuk tiap penerima.
 */
export const notifikasiPetugasBaru = async (jenis: string, detail: { nomor?: string; nama?: string; alasan?: string; pengaju?: string }) => {
  try {
    // Kebijakan: notifikasi hanya ke PETUGAS yang jabatannya bertugas untuk jenis ini.
    // ADMIN tidak menerima notifikasi. Jabatan tanpa tugas (mis. Kasi Pelayanan, Global)
    // atau petugas tanpa jabatan -> tidak menerima.
    const jabatanBertugas = TUGAS_JABATAN[jenis] ?? [];
    if (!jabatanBertugas.length) {
      console.log(`[NOTIF] Jenis "${jenis}" tidak memiliki petugas penanggung jawab - tidak ada notifikasi dikirim.`);
      return;
    }

    const petugas = await prisma.user.findMany({
      where: { role: "PETUGAS", jabatan: { in: jabatanBertugas } },
    });

    if (!petugas.length) {
      console.error(`[NOTIF] Tidak ada petugas dengan jabatan: ${jabatanBertugas.join(", ")}`);
      return;
    }

    const subject = `📢 Permohonan ${jenis} Baru Masuk`;
    const waMessage = pesanWa(jenis, detail);
    const emailHtml = htmlEmail(jenis, detail);

    for (const p of petugas) {
      if (p.email) {
        try {
          await sendEmail(p.email, subject, emailHtml);
          console.log(`[NOTIF] Email ${jenis} → ${p.email} ✅`);
        } catch (e) {
          console.error(`[NOTIF] Gagal email ke ${p.email}:`, e);
        }
      }
      if (p.phone) {
        try {
          await kirimWa(p.phone, waMessage);
          console.log(`[NOTIF] WA ${jenis} → ${p.phone} ✅`);
        } catch (e) {
          console.error(`[NOTIF] Gagal WA ke ${p.phone}:`, e);
        }
      }
    }

    console.log(`[NOTIF] Notifikasi ${jenis} diproses ke ${petugas.length} petugas (jabatan: ${jabatanBertugas.join(", ")})`);
  } catch (e) {
    console.error("[NOTIF] Error notifikasi petugas:", e);
  }
};