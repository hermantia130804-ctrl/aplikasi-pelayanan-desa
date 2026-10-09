"use server";

import { revalidatePath } from "next/cache";
import { ApiError } from "next/dist/server/api-utils";
import status from "http-status";
import { prisma } from "@/lib/prisma";
import { findCurrentSessionService } from "../services/session";
import { toUpperCase, validateNIK, validateNoKK } from "../utils/kependudukan";
import * as XLSX from "xlsx";

type Detail = { nomor?: string; nama?: string; alasan?: string; pengaju?: string };

async function requireUser() {
  const session = await findCurrentSessionService();
  if (!session?.user) throw new ApiError(status.UNAUTHORIZED, "Anda belum masuk.");
  return session;
}

// Normalisasi input: terima nama field camelCase lama (noKK/noHP/punyaKTP) maupun baru (noKk/noHp/punyaKtp)
function normalisasiInput(d: Record<string, unknown>): Record<string, unknown> {
  return {
    ...d,
    noKk: (d.noKk as string) ?? (d.noKK as string) ?? "",
    noHp: (d.noHp as string) ?? (d.noHP as string) ?? "",
    punyaKtp: (d.punyaKtp as string) ?? (d.punyaKTP as string) ?? "BELUM",
  };
}

export async function pendudukRTAction(operation: string, payload?: unknown) {
  try {
    const session = await requireUser();
    const isStaff = session.user.role === "ADMIN" || session.user.role === "PETUGAS";
    const me = await prisma.user.findUnique({ where: { userId: session.user.userId } });

    // ===== LIST =====
    if (operation === "list") {
      const { search } = (payload ?? {}) as { search?: string };
      const where: Record<string, unknown> = isStaff ? {} : { userId: session.user.userId };
      if (search) {
        where.OR = [
          { namaLengkap: { contains: search, mode: "insensitive" } },
          { nik: { contains: search } },
          { noKk: { contains: search } },
        ];
      }
      const data = await prisma.dataWarga.findMany({ where, orderBy: [{ noKk: "asc" }, { createdAt: "asc" }] });
      return { status: 200, data };
    }

    // ===== CREATE =====
    if (operation === "create") {
      if (session.user.role !== "RT") throw new ApiError(status.FORBIDDEN, "Hanya Ketua RT yang dapat menginput.");
      if (!me?.noRt || !me.noRw) throw new ApiError(status.BAD_REQUEST, "Akun RT belum memiliki data wilayah.");
      const d = (payload ?? {}) as Record<string, string | string[] | undefined>;
      if (!validateNoKK(String(d.noKk ?? ""))) throw new ApiError(status.BAD_REQUEST, "No. KK harus 16 digit angka");
      if (!validateNIK(String(d.nik ?? ""))) throw new ApiError(status.BAD_REQUEST, "NIK harus 16 digit angka");

      const dup = await prisma.dataWarga.findUnique({ where: { nik: String(d.nik) } });
      if (dup) throw new ApiError(status.BAD_REQUEST, "NIK sudah terdaftar");

      // Auto-inherit keterangan dari KK head
      let keterangan = (d.keterangan as string) || null;
      if (toUpperCase(String(d.statusKeluarga ?? "")) !== "KEPALA KELUARGA" && !keterangan) {
        const head = await prisma.dataWarga.findFirst({ where: { noKk: String(d.noKk), statusKeluarga: "KEPALA KELUARGA" } });
        if (head?.keterangan) keterangan = head.keterangan;
      }

      const data = await prisma.dataWarga.create({
        data: {
          userId: session.user.userId,
          noKk: String(d.noKk),
          nik: String(d.nik),
          namaLengkap: toUpperCase(String(d.namaLengkap ?? "")),
          jenisKelamin: toUpperCase(String(d.jenisKelamin ?? "")),
          statusKeluarga: toUpperCase(String(d.statusKeluarga ?? "")),
          tempatLahir: toUpperCase(String(d.tempatLahir ?? "-")),
          tanggalLahir: new Date(String(d.tanggalLahir)),
          agama: toUpperCase(String(d.agama ?? "")),
          pendidikan: toUpperCase(String(d.pendidikan ?? "")),
          pekerjaan: toUpperCase(String(d.pekerjaan ?? "")),
          statusPerkawinan: toUpperCase(String(d.statusPerkawinan ?? "")),
          namaAyah: toUpperCase(String(d.namaAyah ?? "-")),
          namaIbu: toUpperCase(String(d.namaIbu ?? "-")),
          namaPanggilan: d.namaPanggilan ? toUpperCase(String(d.namaPanggilan)) : null,
          noHp: (d.noHp as string) || null,
          punyaKtp: ["PUNYA", "BELUM", "RUSAK", "HILANG"].includes(String(d.punyaKtp)) ? String(d.punyaKtp) : "BELUM",
          bantuan: Array.isArray(d.bantuan) ? d.bantuan : [],
          bpjs: (d.bpjs as string) || null,
          desil: (d.desil as string) || null,
          alamat: toUpperCase(String(d.alamat || "KP. CEMPLANG")),
          noRt: me.noRt,
          noRw: me.noRw,
          keterangan,
        },
      });
      revalidatePath("/data-warga");
      return { status: 200, message: "Data berhasil disimpan", data };
    }

    // ===== UPDATE =====
    if (operation === "update") {
      const { id, ...d } = (payload ?? {}) as Record<string, unknown>;
      if (!id) throw new ApiError(status.BAD_REQUEST, "ID diperlukan");
      const existing = await prisma.dataWarga.findUnique({ where: { dataWargaId: String(id) } });
      if (!existing) throw new ApiError(status.NOT_FOUND, "Data tidak ditemukan.");
      if (!isStaff && existing.userId !== session.user.userId) throw new ApiError(status.FORBIDDEN, "Akses ditolak.");

      const u: Record<string, unknown> = {};
      const str = (k: string, upper = true) => {
        if (d[k] !== undefined) u[k] = upper ? toUpperCase(String(d[k])) : String(d[k]);
      };
      if (d.noKk !== undefined) { if (!validateNoKK(String(d.noKk))) throw new ApiError(status.BAD_REQUEST, "No. KK harus 16 digit"); u.noKk = String(d.noKk); }
      if (d.nik !== undefined) { if (!validateNIK(String(d.nik))) throw new ApiError(status.BAD_REQUEST, "NIK harus 16 digit"); u.nik = String(d.nik); }
      str("namaLengkap"); str("jenisKelamin"); str("statusKeluarga"); str("tempatLahir");
      if (d.tanggalLahir !== undefined) u.tanggalLahir = new Date(String(d.tanggalLahir));
      str("agama"); str("pendidikan"); str("pekerjaan"); str("statusPerkawinan");
      if (d.namaPanggilan !== undefined) u.namaPanggilan = d.namaPanggilan ? toUpperCase(String(d.namaPanggilan)) : null;
      if (d.noHp !== undefined) u.noHp = (d.noHp as string) || null;
      if (d.punyaKtp !== undefined && ["PUNYA", "BELUM", "RUSAK", "HILANG"].includes(String(d.punyaKtp))) u.punyaKtp = String(d.punyaKtp);
      if (d.bantuan !== undefined) u.bantuan = Array.isArray(d.bantuan) ? d.bantuan : [];
      if (d.bpjs !== undefined) u.bpjs = (d.bpjs as string) || null;
      if (d.desil !== undefined) u.desil = (d.desil as string) || null;
      str("alamat");
      if (d.keterangan !== undefined) u.keterangan = (d.keterangan as string) || null;

      const data = await prisma.dataWarga.update({ where: { dataWargaId: String(id) }, data: u });
      revalidatePath("/data-warga");
      return { status: 200, message: "Data berhasil diupdate", data };
    }

    // ===== DELETE =====
    if (operation === "delete") {
      const { id } = (payload ?? {}) as { id?: string };
      if (!id) throw new ApiError(status.BAD_REQUEST, "ID diperlukan");
      const existing = await prisma.dataWarga.findUnique({ where: { dataWargaId: id } });
      if (!existing) throw new ApiError(status.NOT_FOUND, "Data tidak ditemukan.");
      if (!isStaff && existing.userId !== session.user.userId) throw new ApiError(status.FORBIDDEN, "Akses ditolak.");
      await prisma.dataWarga.delete({ where: { dataWargaId: id } });
      revalidatePath("/data-warga");
      return { status: 200, message: "Data berhasil dihapus" };
    }

    // ===== DELETE ALL (dengan konfirmasi ketik HAPUS) =====
    if (operation === "deleteAll") {
      const { konfirmasi } = (payload ?? {}) as { konfirmasi?: string };
      if (konfirmasi !== "HAPUS") throw new ApiError(status.BAD_REQUEST, "Ketik HAPUS untuk konfirmasi.");

      const where = isStaff ? {} : { userId: session.user.userId };
      const jumlah = await prisma.dataWarga.count({ where });
      await prisma.dataWarga.deleteMany({ where });
      revalidatePath("/data-warga");
      revalidatePath("/kelola-data-warga");
      return { status: 200, message: `Seluruh data berhasil dihapus (${jumlah} warga)` };
    }

    // ===== IMPORT EXCEL v2 (carry-forward KK, tanggal YYYY-first, laporan lengkap) =====
    if (operation === "importExcel") {
      if (session.user.role !== "RT") throw new ApiError(status.FORBIDDEN, "Impor hanya dapat dilakukan oleh Ketua RT.");
      if (!me?.noRt || !me.noRw) throw new ApiError(status.BAD_REQUEST, "Akun RT belum memiliki data wilayah.");
      const fd = payload as FormData;
      const file = fd.get("file") as File | null;
      if (!file) throw new ApiError(status.BAD_REQUEST, "File diperlukan");

      const buffer = Buffer.from(await file.arrayBuffer());
      const wb = XLSX.read(buffer, { type: "buffer", cellDates: true, raw: false });
      const sheet = wb.Sheets[wb.SheetNames[0]];
      const rows = XLSX.utils.sheet_to_json(sheet, { header: 1, defval: "" }) as unknown[][];

      let headerIdx = 0;
      for (let i = 0; i < Math.min(rows.length, 5); i++) {
        const r = rows[i]; if (!r || r.length < 3) continue;
        const rs = r.map(x => String(x || "").toUpperCase()).join("|");
        if (rs.includes("NO. KK") || rs.includes("NOKK") || rs.includes("NO KK")) { headerIdx = i; break; }
        if (rs.includes("NIK") && rs.includes("NAMA")) { headerIdx = i; break; }
      }
      // Dukungan header DUA TINGKAT (contoh: "Nama Orang Tua" di baris atas, "Ayah"/"Ibu" di baris bawah)
      const head1 = (rows[headerIdx] || []).map(x => String(x || "").toUpperCase().trim());
      const head2 = (rows[headerIdx + 1] || []).map(x => String(x || "").toUpperCase().trim());
      const head2PunyaNama = head2.filter(h => h && !h.includes("TANGGAL") && !h.includes("AGAMA")).length >= 2;
      const head = head1.map((h, i) => {
        const bawah = head2[i];
        return bawah && head2PunyaNama ? bawah : h;
      });
      const findCol = (...names: string[]) => {
        for (const n of names) { const i = head.indexOf(n); if (i >= 0) return i; }
        for (const n of names) { const i = head.findIndex(h => h.includes(n)); if (i >= 0) return i; }
        return -1;
      };
      const C = {
        noKk: findCol("NO. KK", "NOKK", "NO KK"), nama: findCol("NAMA", "NAMA LENGKAP"), nik: findCol("NIK"),
        jk: findCol("JK", "JENIS KELAMIN"), statusKeluarga: findCol("STATUS KK", "STATUS KELUARGA"),
        tempat: findCol("TEMPAT", "TEMPAT LAHIR"), tgl: findCol("TGL LAHIR", "TANGGAL LAHIR"), agama: findCol("AGAMA"),
        pendidikan: findCol("PENDIDIKAN"), pekerjaan: findCol("PEKERJAAN", "JENIS PEKERJAAN"),
        kawin: findCol("STATUS KAWIN", "PERKAWINAN"), wn: findCol("WARGANEGARAAN", "KEWARGANEGARAAN"),
        ayah: findCol("AYAH", "NAMA AYAH"), ibu: findCol("IBU", "NAMA IBU"),
        panggilan: findCol("PANGGILAN"), ket: findCol("KETERANGAN"),
      };

      const digitOnly = (v: unknown) => String(v ?? "").replace(/\D/g, "");
      const parseTgl = (raw: unknown): Date | null => {
        if (raw instanceof Date) return isNaN(raw.getTime()) ? null : raw;
        const str = String(raw ?? "").trim();
        if (!str) return null;
        let m = str.match(/^(\d{4})[-\/.](\d{1,2})[-\/.](\d{1,2})$/);
        if (m) return new Date(+m[1], +m[2] - 1, +m[3]);
        m = str.match(/^(\d{1,2})[-\/.](\d{1,2})[-\/.](\d{4})$/);
        if (m) return new Date(+m[3], +m[2] - 1, +m[1]);
        const num = Number(str);
        if (!isNaN(num) && str === String(num) && num > 10000 && num < 80000) {
          const d = new Date(1899, 11, 30); d.setTime(d.getTime() + num * 86400000);
          return isNaN(d.getTime()) ? null : d;
        }
        return null;
      };

      let created = 0, skipped = 0, dateParseFails = 0, noKkFails = 0;
      const errors: string[] = [];
      const batchNik = new Set<string>();
      let lastNoKk = "";

      for (let i = headerIdx + 1; i < rows.length; i++) {
        const r = rows[i];
        if (!r || !r.some(x => String(x || "").trim())) continue;
        const nama = toUpperCase(String(r[C.nama] ?? "").trim());
        const nik = digitOnly(r[C.nik]).substring(0, 16);

        const kkBaru = digitOnly(r[C.noKk]);
        if (kkBaru.length >= 8) lastNoKk = kkBaru.padStart(16, "0").slice(-16);
        const noKk = lastNoKk;

        if (!nama) continue;
        if (!noKk || noKk.length !== 16) { noKkFails++; errors.push("Baris " + (i + 1) + " (" + nama + "): No. KK tidak valid"); continue; }
        if (!nik || nik.length !== 16) { skipped++; errors.push("Baris " + (i + 1) + " (" + nama + "): NIK tidak valid"); continue; }
        if (batchNik.has(nik)) { skipped++; errors.push("Baris " + (i + 1) + " (" + nama + "): NIK duplikat dalam file"); continue; }
        const dup = await prisma.dataWarga.findUnique({ where: { nik } });
        if (dup) { skipped++; continue; }
        const tgl = parseTgl(r[C.tgl]);
        if (!tgl) { dateParseFails++; errors.push("Baris " + (i + 1) + " (" + nama + "): tanggal lahir tidak valid"); continue; }

        const jk = toUpperCase(String(r[C.jk] ?? ""));
        batchNik.add(nik);
        try {
          await prisma.dataWarga.create({
            data: {
              userId: session.user.userId,
              noKk, nik, namaLengkap: nama,
              jenisKelamin: jk.includes("LAKI") || jk === "L" ? "LAKI-LAKI" : "PEREMPUAN",
              statusKeluarga: toUpperCase(String(r[C.statusKeluarga] ?? "LAINNYA")),
              tempatLahir: toUpperCase(String(r[C.tempat] ?? "-")), tanggalLahir: tgl,
              agama: toUpperCase(String(r[C.agama] ?? "ISLAM")),
              pendidikan: toUpperCase(String(r[C.pendidikan] ?? "TIDAK/BELUM SEKOLAH")),
              pekerjaan: toUpperCase(String(r[C.pekerjaan] ?? "BELUM/TIDAK BEKERJA")),
              statusPerkawinan: toUpperCase(String(r[C.kawin] ?? "BELUM MENIKAH")),
              kewarganegaraan: toUpperCase(String(r[C.wn] ?? "WNI")),
              namaAyah: toUpperCase(String(r[C.ayah] ?? "-")),
              namaIbu: toUpperCase(String(r[C.ibu] ?? "-")),
              namaPanggilan: r[C.panggilan] ? toUpperCase(String(r[C.panggilan])) : null,
              noHp: r[C.nik] && C.ket + 1 >= 0 ? (String(r[C.nik] ?? "").trim() ? null : null) : null,
              alamat: "KP. CEMPLANG",
              noRt: me.noRt, noRw: me.noRw,
              keterangan: r[C.ket] ? String(r[C.ket]) : null,
            },
          });
          created++;
        } catch (e) { errors.push("Baris " + (i + 1) + " (" + nama + "): gagal tersimpan"); }
      }
      revalidatePath("/data-warga");
      revalidatePath("/kelola-data-warga");
      return { status: 200, message: "Impor selesai: " + created + " tersimpan, " + skipped + " dilewati", created, skipped, dateParseFails, noKkFails, errors };
    }

    return { status: 400, error: "Operasi tidak dikenal" };
    return { status: 400, error: "Operasi tidak dikenal" };
  } catch (error) {
    if (error instanceof ApiError) return { status: error.statusCode, error: error.message };
    console.error("ERROR ASLI (pendudukRT):", error);
    return { status: 500, error: "Terjadi kesalahan pada server" };
  }
}
