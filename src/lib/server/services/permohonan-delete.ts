import { del } from "@vercel/blob";
import { prisma } from "@/lib/prisma";

const hapusBlobs = async (urls: (string | null | undefined)[]) => {
  const list = urls.filter((u): u is string => Boolean(u));
  if (!list.length) return;
  try {
    await del(list);
    console.log(`[DELETE] ${list.length} file blob dihapus`);
  } catch (e) {
    console.error("[DELETE] Gagal hapus file blob (baris tetap dihapus):", e);
  }
};

/**
 * Menghapus permohonan BESERTA file dokumennya di Vercel Blob.
 * Dipanggil oleh action delete (khusus admin).
 */
export const deletePermohonanWithFiles = async (jenis: string, id: string) => {
  switch (jenis) {
    case "KTP": {
      const d = await prisma.permohonanKTP.findUnique({ where: { permohonanKtpId: id } });
      if (!d) return;
      await hapusBlobs([d.dokumenKK, d.dokumenPengantar]);
      await prisma.permohonanKTP.delete({ where: { permohonanKtpId: id } });
      return;
    }
    case "KK": {
      const d = await prisma.permohonanKK.findUnique({ where: { permohonanKKId: id } });
      if (!d) return;
      await hapusBlobs([d.dokumenKTP, d.dokumenAkta, d.dokumenPengantar]);
      await prisma.permohonanKK.delete({ where: { permohonanKKId: id } });
      return;
    }
    case "SKL": {
      const d = await prisma.permohonanSKL.findUnique({ where: { permohonanSKLId: id } });
      if (!d) return;
      await hapusBlobs([d.dokumenKK, d.dokumenPengantar, d.dokumenSuratLahir]);
      await prisma.permohonanSKL.delete({ where: { permohonanSKLId: id } });
      return;
    }
    case "SKTM": {
      const d = await prisma.permohonanSKTM.findUnique({ where: { permohonanSKTMId: id } });
      if (!d) return;
      await hapusBlobs([d.dokumenKK, d.dokumenKTP, d.dokumenPengantar]);
      await prisma.permohonanSKTM.delete({ where: { permohonanSKTMId: id } });
      return;
    }
    case "SKK": {
      await prisma.permohonanSKK.delete({ where: { permohonanSKKId: id } });
      return;
    }
    case "SKU": {
      const d = await prisma.permohonanSKU.findUnique({ where: { permohonanSKUId: id } });
      if (!d) return;
      await hapusBlobs([d.dokumenKK, d.dokumenKTP, d.dokumenSP, d.dokumenUsaha]);
      await prisma.permohonanSKU.delete({ where: { permohonanSKUId: id } });
      return;
    }
    case "SKD": {
      const d = await prisma.permohonanSKD.findUnique({ where: { permohonanSKDId: id } });
      if (!d) return;
      await hapusBlobs([d.dokumenKK, d.dokumenKTP, d.dokumenSP]);
      await prisma.permohonanSKD.delete({ where: { permohonanSKDId: id } });
      return;
    }
    case "PINDAH": {
      const d = await prisma.permohonanPindah.findUnique({ where: { permohonanPindahId: id } });
      if (!d) return;
      await hapusBlobs([d.dokumenKK, d.dokumenKTP, d.dokumenSP]);
      await prisma.permohonanPindah.delete({ where: { permohonanPindahId: id } });
      return;
    }
    default:
      throw new Error(`Jenis permohonan tidak dikenal: ${jenis}`);
  }
};
