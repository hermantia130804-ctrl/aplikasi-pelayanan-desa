import { prisma } from "@/lib/prisma";
import { sendEmail } from "../utils/email";
import { kirimWa } from "./whatsapp";

type DetailNotif = {
  nomor?: string;
  nama?: string;
  alasan?: string;
  pengaju?: string;
};

const pesanWa = (jenis: string, d: DetailNotif) =>
  `📢 *PERMOHONAN ${jenis} BARU*\n\n` +
  (d.nomor ? `🧾 No: ${d.nomor}\n` : "") +
  `👤 Nama: ${d.nama ?? "-"}\n` +
  (d.alasan ? `📌 Perihal: ${d.alasan}\n` : "") +
  (d.pengaju ? `🌐 Pengaju: ${d.pengaju}\n` : "") +
  `\nSilakan proses melalui menu Kelola ${jenis} di aplikasi.\n` +
  `_Aplikasi Pelayanan Desa Sukamaju_`;

const htmlEmail = (jenis: string, d: DetailNotif) =>
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
 * Kirim EMAIL + WA ke semua PETUGAS & ADMIN (dari database).
 * Kegagalan satu saluran tidak menggagalkan yang lain.
 */
export const notifikasiPetugasBaru = async (jenis: string, detail: DetailNotif) => {
  try {
    const petugas = await prisma.user.findMany({
      where: { role: { in: ["PETUGAS", "ADMIN"] } },
    });

    if (!petugas.length) {
      console.error("[NOTIF] Tidak ada petugas/admin di database");
      return;
    }

    const subject = `📢 Permohonan ${jenis} Baru Masuk`;

    for (const p of petugas) {
      if (p.email) {
        try {
          await sendEmail(p.email, subject, htmlEmail(jenis, detail));
          console.log(`[NOTIF] Email ${jenis} terkirim ke ${p.email}`);
        } catch (e) {
          console.error(`[NOTIF] Gagal email ke ${p.email}:`, e);
        }
      }
      if (p.phone) {
        try {
          await kirimWa(p.phone, pesanWa(jenis, detail));
        } catch (e) {
          console.error(`[NOTIF] Gagal WA ke ${p.phone}:`, e);
        }
      }
    }

    console.log(`[NOTIF] Notifikasi ${jenis} diproses ke ${petugas.length} penerima`);
  } catch (e) {
    console.error("[NOTIF] Error notifikasi petugas:", e);
  }
};
