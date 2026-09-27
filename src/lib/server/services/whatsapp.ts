import { prisma } from "@/lib/prisma";

const normalisasiNomor = (phone: string): string | null => {
  if (!phone) return null;
  let n = phone.replace(/[^0-9]/g, "");
  if (n.startsWith("0")) n = "62" + n.slice(1);
  if (n.startsWith("8")) n = "62" + n;
  if (!n.startsWith("62")) return null;
  if (n.length < 10 || n.length > 15) return null;
  return n;
};

export const kirimWa = async (target: string, pesan: string): Promise<boolean> => {
  const nomor = normalisasiNomor(target);
  if (!nomor) {
    console.error("[WA] Nomor tidak valid:", target);
    return false;
  }

  const token = process.env.FONNTE_TOKEN;
  const domain = process.env.FONNTE_DOMAIN || "md.fonnte.com";
  if (!token) {
    console.error("[WA] FONNTE_TOKEN tidak ada di env");
    return false;
  }

  try {
    const res = await fetch(`https://${domain}/send`, {
      method: "POST",
      headers: {
        Authorization: token,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ target: nomor, message: pesan }),
    });
    const json = await res.json().catch(() => ({}));
    if (res.ok && json?.status !== false) {
      console.log(`[WA] Terkirim ke ${nomor}`);
      return true;
    }
    console.error("[WA] Gagal kirim:", JSON.stringify(json));
    return false;
  } catch (e) {
    console.error("[WA] Error kirim:", e);
    return false;
  }
};

/**
 * Kirim WA ke semua PETUGAS + ADMIN_EMAIL (opsional) + pesan detail permohonan.
 * jenis: KTP | KK | SKL | SKTM | SKK | SKU | SKD | PINDAH
 */
export const kirimWaPetugasBaru = async (
  jenis: string,
  detail: { nomor?: string; nama?: string; alasan?: string; pengaju?: string }
) => {
  try {
    const token = process.env.FONNTE_TOKEN;
    const domain = process.env.FONNTE_DOMAIN || "md.fonnte.com";
    if (!token) {
      console.error("[WA] FONNTE_TOKEN tidak ada — skip notifikasi WA petugas");
      return;
    }

    const petugas = await prisma.user.findMany({
      where: { role: { in: ["PETUGAS", "ADMIN"] } },
    });

    const pesan =
      `📢 *PERMOHONAN ${jenis} BARU*\n\n` +
      (detail.nomor ? `🧾 No: ${detail.nomor}\n` : "") +
      `👤 Nama: ${detail.nama ?? "-"}\n` +
      (detail.alasan ? `📌 Perihal: ${detail.alasan}\n` : "") +
      (detail.pengaju ? `🌐 Pengaju: ${detail.pengaju}\n` : "") +
      `\nSilakan proses melalui menu Kelola ${jenis} di aplikasi.\n` +
      `_Aplikasi Pelayanan Desa Sukamaju_`;

    let sukses = 0;
    for (const p of petugas) {
      const ok = await kirimWa(p.phone ?? "", pesan);
      if (ok) sukses++;
    }
    console.log(`[WA] Notif ${jenis} terkirim ke ${sukses}/${petugas.length} petugas`);
  } catch (e) {
    console.error("[WA] Error notif petugas:", e);
  }
};
