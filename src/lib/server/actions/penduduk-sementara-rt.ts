"use server";

import status from "http-status";
import { revalidatePath } from "next/cache";
import { ApiError } from "next/dist/server/api-utils";
import { prisma } from "@/lib/prisma";
import { findCurrentSessionService } from "../services/session";
import { toUpperCase, validateNIK, validateNoKK } from "../utils/kependudukan";

const getSession = async () => {
  const s = await findCurrentSessionService();
  if (!s?.user) throw new ApiError(status.UNAUTHORIZED, "Anda belum masuk.");
  return s;
};

export async function sementaraRTAction(operation: string, payload?: unknown) {
  try {
    const session = await getSession();
    const isStaff = session.user.role === "ADMIN" || session.user.role === "PETUGAS";
    const me = await prisma.user.findUnique({ where: { userId: session.user.userId } });
    const isRT = session.user.role === "RT";

    if (operation === "list") {
      const { search, statusKet } = (payload ?? {}) as { search?: string; statusKet?: string };
      const where: Record<string, unknown> = isStaff ? {} : { userId: session.user.userId };
      if (statusKet) where.statusKeterangan = statusKet;
      if (search) where.OR = [
        { namaLengkap: { contains: search, mode: "insensitive" } },
        { nik: { contains: search } },
        { noKk: { contains: search } },
        { alamatAsal: { contains: search, mode: "insensitive" } },
      ];
      const data = await prisma.pendudukSementara.findMany({ where, orderBy: [{ noKk: "asc" }, { createdAt: "asc" }] });
      return { status: 200, data };
    }

    if (operation === "create") {
      if (!isRT) throw new ApiError(status.FORBIDDEN, "Hanya Ketua RT yang dapat menginput.");
      if (!me?.noRt || !me.noRw) throw new ApiError(status.BAD_REQUEST, "Akun RT belum memiliki data wilayah.");
      const d = normalisasi((payload ?? {}) as Record<string, unknown>);
      if (!validateNIK(String(d.nik ?? ""))) throw new ApiError(status.BAD_REQUEST, "NIK harus 16 digit angka");
      if (!validateNoKK(String(d.noKk ?? ""))) throw new ApiError(status.BAD_REQUEST, "No. KK harus 16 digit angka");
      const dup = await prisma.pendudukSementara.findUnique({ where: { nik: String(d.nik) } });
      if (dup) throw new ApiError(status.BAD_REQUEST, "NIK sudah terdaftar");

      const data = await prisma.pendudukSementara.create({
        data: {
          userId: session.user.userId,
          noKk: String(d.noKk), nik: String(d.nik),
          namaLengkap: toUpperCase(String(d.namaLengkap ?? "")),
          jenisKelamin: toUpperCase(String(d.jenisKelamin ?? "")),
          statusKeluarga: toUpperCase(String(d.statusKeluarga ?? "LAINNYA")),
          tempatLahir: toUpperCase(String(d.tempatLahir ?? "-")),
          tanggalLahir: new Date(String(d.tanggalLahir)),
          agama: toUpperCase(String(d.agama ?? "ISLAM")),
          pendidikan: toUpperCase(String(d.pendidikan ?? "TIDAK/BELUM SEKOLAH")),
          pekerjaan: toUpperCase(String(d.pekerjaan ?? "BELUM/TIDAK BEKERJA")),
          statusPerkawinan: toUpperCase(String(d.statusPerkawinan ?? "BELUM MENIKAH")),
          statusKeterangan: toUpperCase(String(d.statusKeterangan ?? "KONTRAK")),
          alamatAsal: toUpperCase(String(d.alamatAsal ?? "")),
          noHp: (d.noHp as string) || null,
          namaPanggilan: d.namaPanggilan ? toUpperCase(String(d.namaPanggilan)) : null,
          bantuan: Array.isArray(d.bantuan) ? d.bantuan : [],
          bpjs: (d.bpjs as string) || null,
          alamat: toUpperCase(String(d.alamat || "KP. CEMPLANG")),
          noRt: me.noRt, noRw: me.noRw,
          tanggalMasuk: d.tanggalMasuk ? new Date(String(d.tanggalMasuk)) : new Date(),
          tanggalKeluar: d.tanggalKeluar ? new Date(String(d.tanggalKeluar)) : null,
          keterangan: (d.keterangan as string) || null,
        },
      });
      revalidatePath("/data-warga");
      return { status: 200, message: "Penduduk sementara berhasil disimpan", data };
    }

    if (operation === "update") {
      const { id, ...d } = (payload ?? {}) as Record<string, unknown>;
      if (!id) throw new ApiError(status.BAD_REQUEST, "ID diperlukan");
      const existing = await prisma.pendudukSementara.findUnique({ where: { pendudukSementaraId: String(id) } });
      if (!existing) throw new ApiError(status.NOT_FOUND, "Data tidak ditemukan.");
      if (!isStaff && existing.userId !== session.user.userId) throw new ApiError(status.FORBIDDEN, "Akses ditolak.");
      if (d.nik && !validateNIK(String(d.nik))) throw new ApiError(status.BAD_REQUEST, "NIK harus 16 digit angka");
      if (d.noKk && !validateNoKK(String(d.noKk))) throw new ApiError(status.BAD_REQUEST, "No. KK harus 16 digit angka");

      const u: Record<string, unknown> = {};
      const str = (k: string) => { if (d[k] !== undefined) u[k] = toUpperCase(String(d[k])); };
      str("noKk"); str("nik"); str("namaLengkap"); str("jenisKelamin"); str("statusKeluarga"); str("tempatLahir"); str("agama"); str("pendidikan"); str("pekerjaan"); str("statusPerkawinan"); str("statusKeterangan"); str("alamatAsal"); str("alamat");
      if (d.tanggalLahir !== undefined) u.tanggalLahir = new Date(String(d.tanggalLahir));
      if (d.tanggalMasuk !== undefined) u.tanggalMasuk = new Date(String(d.tanggalMasuk));
      if (d.tanggalKeluar !== undefined) u.tanggalKeluar = d.tanggalKeluar ? new Date(String(d.tanggalKeluar)) : null;
      if (d.namaPanggilan !== undefined) u.namaPanggilan = d.namaPanggilan ? toUpperCase(String(d.namaPanggilan)) : null;
      if (d.noHp !== undefined) u.noHp = (d.noHp as string) || null;
      if (d.bantuan !== undefined) u.bantuan = Array.isArray(d.bantuan) ? d.bantuan : [];
      if (d.bpjs !== undefined) u.bpjs = (d.bpjs as string) || null;
      if (d.keterangan !== undefined) u.keterangan = (d.keterangan as string) || null;

      const data = await prisma.pendudukSementara.update({ where: { pendudukSementaraId: String(id) }, data: u });
      revalidatePath("/data-warga");
      return { status: 200, message: "Data berhasil diupdate", data };
    }

    if (operation === "delete") {
      const { id } = (payload ?? {}) as { id?: string };
      if (!id) throw new ApiError(status.BAD_REQUEST, "ID diperlukan");
      const existing = await prisma.pendudukSementara.findUnique({ where: { pendudukSementaraId: String(id) } });
      if (!existing) throw new ApiError(status.NOT_FOUND, "Data tidak ditemukan.");
      if (!isStaff && existing.userId !== session.user.userId) throw new ApiError(status.FORBIDDEN, "Akses ditolak.");
      await prisma.pendudukSementara.delete({ where: { pendudukSementaraId: String(id) } });
      revalidatePath("/data-warga");
      return { status: 200, message: "Data berhasil dihapus" };
    }

    // ===== DELETE ALL (konfirmasi ketik HAPUS) =====
    if (operation === "deleteAll") {
      const { konfirmasi } = (payload ?? {}) as { konfirmasi?: string };
      if (konfirmasi !== "HAPUS") throw new ApiError(status.BAD_REQUEST, "Ketik HAPUS untuk konfirmasi.");
      const where = isStaff ? {} : { userId: session.user.userId };
      const jumlah = await prisma.pendudukSementara.count({ where });
      await prisma.pendudukSementara.deleteMany({ where });
      revalidatePath("/data-warga");
      return { status: 200, message: `Seluruh data penduduk sementara berhasil dihapus (${jumlah} orang)` };
    }

    // ===== IMPORT EXCEL =====
    if (operation === "importExcel") {
      if (!isRT) throw new ApiError(status.FORBIDDEN, "Impor hanya dapat dilakukan oleh Ketua RT.");
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
        if (rs.includes("NIK")) { headerIdx = i; break; }
      }
      const head = (rows[headerIdx] || []).map(x => String(x || "").toUpperCase().trim());
      const findCol = (...names: string[]) => {
        for (const n of names) { const i = head.indexOf(n); if (i >= 0) return i; }
        for (const n of names) { const i = head.findIndex(h => h.includes(n)); if (i >= 0) return i; }
        return -1;
      };
      const C = {
        noKk: findCol("NO. KK", "NOKK", "NO KK"), nik: findCol("NIK"), nama: findCol("NAMA"),
        jk: findCol("JK", "JENIS KELAMIN"), statusKeluarga: findCol("STATUS KK", "STATUS KELUARGA"),
        tglLahir: findCol("TGL LAHIR", "TANGGAL LAHIR"), agama: findCol("AGAMA"),
        pendidikan: findCol("PENDIDIKAN"), pekerjaan: findCol("PEKERJAAN"),
        kawin: findCol("STATUS KAWIN", "PERKAWINAN"), statusKet: findCol("STATUS", "STATUS TINGGAL", "STATUS KETERANGAN"),
        asal: findCol("ASAL", "ALAMAT ASAL"), tglMasuk: findCol("MASUK"), tglKeluar: findCol("KELUAR"),
        ket: findCol("KETERANGAN"),
      };
      const digitOnly = (v: unknown) => String(v ?? "").replace(/\D/g, "");
      const parseTgl = (raw: unknown): Date | null => {
        if (raw instanceof Date) return isNaN(raw.getTime()) ? null : raw;
        const str = String(raw ?? "").trim(); if (!str) return null;
        let m = str.match(/^(\d{4})[-\/.](\d{1,2})[-\/.](\d{1,2})$/); if (m) return new Date(+m[1], +m[2] - 1, +m[3]);
        m = str.match(/^(\d{1,2})[-\/.](\d{1,2})[-\/.](\d{4})$/); if (m) return new Date(+m[3], +m[2] - 1, +m[1]);
        return null;
      };

      let created = 0, skipped = 0;
      const errors: string[] = [];
      for (let i = headerIdx + 1; i < rows.length; i++) {
        const r = rows[i];
        if (!r || !r.some(x => String(x || "").trim())) continue;
        const nik = digitOnly(r[C.nik]).substring(0, 16);
        const nama = toUpperCase(String(r[C.nama] ?? "").trim());
        if (!nik || nik.length !== 16 || !nama) { skipped++; continue; }
        const dup = await prisma.pendudukSementara.findUnique({ where: { nik } });
        if (dup) { skipped++; continue; }
        const tglLahir = parseTgl(r[C.tglLahir]);
        if (!tglLahir) { errors.push("Baris " + (i + 1) + " (" + nama + "): tanggal lahir tidak valid"); continue; }
        try {
          await prisma.pendudukSementara.create({
            data: {
              userId: session.user.userId, noKk: digitOnly(r[C.noKk]).padStart(16, "0"), nik, namaLengkap: nama,
              jenisKelamin: toUpperCase(String(r[C.jk] ?? "")).includes("LAKI") ? "LAKI-LAKI" : "PEREMPUAN",
              statusKeluarga: toUpperCase(String(r[C.statusKeluarga] ?? "LAINNYA")),
              tempatLahir: toUpperCase(String(r[C.tglLahir >= 0 ? C.tglLahir : C.tglLahir] ?? "-")),
              tanggalLahir: tglLahir,
              agama: toUpperCase(String(r[C.agama] ?? "ISLAM")),
              pendidikan: toUpperCase(String(r[C.pendidikan] ?? "TIDAK/BELUM SEKOLAH")),
              pekerjaan: toUpperCase(String(r[C.pekerjaan] ?? "BELUM/TIDAK BEKERJA")),
              statusPerkawinan: toUpperCase(String(r[C.kawin] ?? "BELUM MENIKAH")),
              statusKeterangan: toUpperCase(String(r[C.statusKet] ?? "KONTRAK")),
              alamatAsal: toUpperCase(String(r[C.asal] ?? "")),
              tanggalMasuk: parseTgl(r[C.tglMasuk]) ?? new Date(),
              tanggalKeluar: parseTgl(r[C.tglKeluar]),
              noRt: me.noRt, noRw: me.noRw,
              keterangan: r[C.ket] ? String(r[C.ket]) : null,
            },
          });
          created++;
        } catch (e) { errors.push("Baris " + (i + 1) + " (" + nama + "): gagal"); }
      }
      revalidatePath("/data-warga");
      return { status: 200, message: "Impor selesai: " + created + " tersimpan, " + skipped + " dilewati", created, skipped, errors };
    }

    return { status: 400, error: "Operasi tidak dikenal" };
  } catch (error) {
    if (error instanceof ApiError) return { status: error.statusCode, error: error.message };
    console.error("ERROR ASLI (sementaraRT):", error);
    return { status: 500, error: "Terjadi kesalahan pada server." };
  }
}

function normalisasi(d: Record<string, unknown>): Record<string, unknown> {
  return { ...d,
    noKk: (d.noKk as string) ?? (d.noKK as string) ?? "",
    noHp: (d.noHp as string) ?? (d.noHP as string) ?? "",
    punyaKtp: (d.punyaKtp as string) ?? (d.punyaKTP as string) ?? "BELUM",
  };
}
