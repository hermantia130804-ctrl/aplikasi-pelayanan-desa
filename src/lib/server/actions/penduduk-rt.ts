"use server";

import { revalidatePath } from "next/cache";
import { ApiError } from "next/dist/server/api-utils";
import status from "http-status";
import { prisma } from "@/lib/prisma";
import { findCurrentSessionService } from "../services/session";
import { toUpperCase, validateNIK, validateNoKK, autoKtpStatus } from "../utils/kependudukan";
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
      const { search, filterRt, filterRw } = (payload ?? {}) as { search?: string; filterRt?: string; filterRw?: string };
      // ADMIN/PETUGAS: bebas memilih wilayah (kosong = Semua RT/RW, tampil tergabung).
      // Role lain (Ketua RT): TERKUNCI di level server ke wilayah RT-nya (kolom no_rt/no_rw tabel users) - tidak bisa dibobol dari client.
      const where: Record<string, unknown> =
        isStaff
          ? {}
          : me?.noRt && me?.noRw
            ? { noRt: me.noRt, noRw: me.noRw }
            : { userId: session.user.userId };
      if (isStaff) {
        if (filterRt && filterRt !== "SEMUA") where.noRt = String(filterRt);
        if (filterRw && filterRw !== "SEMUA") where.noRw = String(filterRw);
      }
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

    // ===== LIST OPSI WILAYAH (untuk dropdown filter ADMIN/PETUGAS) =====
    if (operation === "listRT") {
      if (!isStaff) throw new ApiError(status.FORBIDDEN, "Akses ditolak.");
      const [warga, sem, akun] = await Promise.all([
        prisma.dataWarga.findMany({ distinct: ["noRt", "noRw"], select: { noRt: true, noRw: true } }),
        prisma.pendudukSementara.findMany({ distinct: ["noRt", "noRw"], select: { noRt: true, noRw: true } }),
        prisma.user.findMany({ where: { role: "RT" }, select: { noRt: true, noRw: true } }),
      ]);
      const map = new Map<string, { noRt: string; noRw: string }>();
      for (const x of [...warga, ...sem, ...akun]) {
        const rt = x.noRt; const rw = x.noRw;
        if (rt && rw) map.set(`${rt}-${rw}`, { noRt: rt, noRw: rw });
      }
      const data = Array.from(map.values()).sort((a, b) => a.noRt.localeCompare(b.noRt) || a.noRw.localeCompare(b.noRw));
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
          // Auto-fill KTP: jika umur >= 19 tahun, otomatis "PUNYA" (override input user)
          punyaKtp: (() => {
            const tglLahir = new Date(String(d.tanggalLahir));
            const autoStatus = autoKtpStatus(tglLahir);
            if (autoStatus === "PUNYA") return "PUNYA"; // umur >= 19 → wajib PUNYA
            // umur < 19: pakai input user kalau valid, kalau tidak default BELUM
            return ["PUNYA", "BELUM", "RUSAK", "HILANG"].includes(String(d.punyaKtp)) ? String(d.punyaKtp) : "BELUM";
          })(),
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
      // Revalidate beranda (dashboard + public) supaya statistik langsung update tanpa manual refresh
      revalidatePath("/dashboard");
      revalidatePath("/");
      return { status: 200, message: "Data berhasil disimpan", data };
    }

    // ===== UPDATE =====
    if (operation === "update") {
      const { id, ...d } = (payload ?? {}) as Record<string, unknown>;
      if (!id) throw new ApiError(status.BAD_REQUEST, "ID diperlukan");
      const existing = await prisma.dataWarga.findUnique({ where: { dataWargaId: String(id) } });
      if (!existing) throw new ApiError(status.NOT_FOUND, "Data tidak ditemukan.");
      // Izin kelola: staff, pembuat data, atau Ketua RT atas data wilayah RT-nya sendiri
      const bolehKelola = isStaff || existing.userId === session.user.userId || (!!me?.noRt && !!me?.noRw && existing.noRt === me.noRt && existing.noRw === me.noRw);
      if (!bolehKelola) throw new ApiError(status.FORBIDDEN, "Akses ditolak.");

      const u: Record<string, unknown> = {};
      const str = (k: string, upper = true) => {
        if (d[k] !== undefined) u[k] = upper ? toUpperCase(String(d[k])) : String(d[k]);
      };
      if (d.noKk !== undefined) { if (!validateNoKK(String(d.noKk))) throw new ApiError(status.BAD_REQUEST, "No. KK harus 16 digit"); u.noKk = String(d.noKk); }
      if (d.nik !== undefined) { if (!validateNIK(String(d.nik))) throw new ApiError(status.BAD_REQUEST, "NIK harus 16 digit"); u.nik = String(d.nik); }
      str("namaLengkap"); str("jenisKelamin"); str("statusKeluarga"); str("tempatLahir");
      if (d.tanggalLahir !== undefined) {
        u.tanggalLahir = new Date(String(d.tanggalLahir));
        // Auto-fill KTP saat tanggalLahir diubah: umur >= 19 → PUNYA
        const autoStatus = autoKtpStatus(new Date(String(d.tanggalLahir)));
        if (autoStatus === "PUNYA") u.punyaKtp = "PUNYA";
      }
      str("agama"); str("pendidikan"); str("pekerjaan"); str("statusPerkawinan");
      if (d.namaPanggilan !== undefined) u.namaPanggilan = d.namaPanggilan ? toUpperCase(String(d.namaPanggilan)) : null;
      if (d.noHp !== undefined) u.noHp = (d.noHp as string) || null;
      // punyaKtp: jika user set manual DAN umur >= 19, override ke PUNYA
      if (d.punyaKtp !== undefined && ["PUNYA", "BELUM", "RUSAK", "HILANG"].includes(String(d.punyaKtp))) {
        // Cek umur dari tanggalLahir existing atau yang baru di-set
        const tglForKtp = d.tanggalLahir !== undefined ? new Date(String(d.tanggalLahir)) : existing.tanggalLahir;
        const autoStatus = autoKtpStatus(tglForKtp);
        u.punyaKtp = autoStatus === "PUNYA" ? "PUNYA" : String(d.punyaKtp);
      }
      if (d.bantuan !== undefined) u.bantuan = Array.isArray(d.bantuan) ? d.bantuan : [];
      if (d.bpjs !== undefined) u.bpjs = (d.bpjs as string) || null;
      if (d.desil !== undefined) u.desil = (d.desil as string) || null;
      str("alamat");
      if (d.keterangan !== undefined) u.keterangan = (d.keterangan as string) || null;

      const data = await prisma.dataWarga.update({ where: { dataWargaId: String(id) }, data: u });
      revalidatePath("/data-warga");
      // Revalidate beranda (dashboard + public) supaya statistik langsung update tanpa manual refresh
      revalidatePath("/dashboard");
      revalidatePath("/");
      return { status: 200, message: "Data berhasil diupdate", data };
    }

    // ===== DELETE =====
    if (operation === "delete") {
      const { id } = (payload ?? {}) as { id?: string };
      if (!id) throw new ApiError(status.BAD_REQUEST, "ID diperlukan");
      const existing = await prisma.dataWarga.findUnique({ where: { dataWargaId: id } });
      if (!existing) throw new ApiError(status.NOT_FOUND, "Data tidak ditemukan.");
      const bolehKelola = isStaff || existing.userId === session.user.userId || (!!me?.noRt && !!me?.noRw && existing.noRt === me.noRt && existing.noRw === me.noRw);
      if (!bolehKelola) throw new ApiError(status.FORBIDDEN, "Akses ditolak.");
      await prisma.dataWarga.delete({ where: { dataWargaId: id } });
      revalidatePath("/data-warga");
      // Revalidate beranda (dashboard + public) supaya statistik langsung update tanpa manual refresh
      revalidatePath("/dashboard");
      revalidatePath("/");
      return { status: 200, message: "Data berhasil dihapus" };
    }

    // ===== LIST ANGGOTA satu KK (gabungan tetap + sementara, untuk dropdown kejadian) =====
    if (operation === "listAnggota") {
      const { noKK } = (payload ?? {}) as { noKK?: string };
      if (!noKK) return { status: 200, data: [] };
      const tetap = await prisma.dataWarga.findMany({
        where: { noKk: noKK },
        orderBy: { createdAt: "asc" },
      });
      const sementara = await prisma.pendudukSementara.findMany({
        where: { noKk: noKK },
        orderBy: { createdAt: "asc" },
      });
      const data = [
        ...tetap.map(p => ({
          id: p.dataWargaId, sumber: "tetap",
          noKk: p.noKk, nik: p.nik, namaLengkap: p.namaLengkap,
          jenisKelamin: p.jenisKelamin, statusKeluarga: p.statusKeluarga,
        })),
        ...sementara.map(p => ({
          id: p.pendudukSementaraId, sumber: "sementara",
          noKk: p.noKk, nik: p.nik, namaLengkap: p.namaLengkap,
          jenisKelamin: p.jenisKelamin, statusKeluarga: p.statusKeluarga,
        })),
      ];
      return { status: 200, data };
    }

    // ===== DELETE ALL (dengan konfirmasi ketik HAPUS) =====
    if (operation === "deleteAll") {
      const { konfirmasi, filterRt, filterRw } = (payload ?? {}) as { konfirmasi?: string; filterRt?: string; filterRw?: string };
      if (konfirmasi !== "HAPUS") throw new ApiError(status.BAD_REQUEST, "Ketik HAPUS untuk konfirmasi.");

      // Filter sama seperti list: staff bebas (boleh filter RT/RW); RT terkunci wilayahnya
      const where: Record<string, unknown> =
        isStaff
          ? {}
          : me?.noRt && me?.noRw
            ? { noRt: me.noRt, noRw: me.noRw }
            : { userId: session.user.userId };
      if (isStaff) {
        if (filterRt && filterRt !== "SEMUA") where.noRt = String(filterRt);
        if (filterRw && filterRw !== "SEMUA") where.noRw = String(filterRw);
      }
      const jumlah = await prisma.dataWarga.count({ where });
      await prisma.dataWarga.deleteMany({ where });
      revalidatePath("/data-warga");
      // Revalidate beranda (dashboard + public) supaya statistik langsung update tanpa manual refresh
      revalidatePath("/dashboard");
      revalidatePath("/");
      revalidatePath("/kelola-data-warga");
      return { status: 200, message: `Seluruh data berhasil dihapus (${jumlah} warga)`, jumlah };
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
        kawin: findCol("STATUS KAWIN", "SATAUS PERKAWINAN", "PERKAWINAN"), wn: findCol("KEWARGANEGARAAN", "KEWARGA NEGARAAN", "WARGANEGARAAN"),
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
              // Auto-fill KTP: umur >= 19 → PUNYA
              punyaKtp: autoKtpStatus(tgl),
              alamat: "KP. CEMPLANG",
              noRt: me.noRt, noRw: me.noRw,
              keterangan: r[C.ket] ? String(r[C.ket]) : null,
            },
          });
          created++;
        } catch (e) { errors.push("Baris " + (i + 1) + " (" + nama + "): gagal tersimpan"); }
      }
      revalidatePath("/data-warga");
      // Revalidate beranda (dashboard + public) supaya statistik langsung update tanpa manual refresh
      revalidatePath("/dashboard");
      revalidatePath("/");
      revalidatePath("/kelola-data-warga");
      return { status: 200, message: "Impor selesai: " + created + " tersimpan, " + skipped + " dilewati", created, skipped, dateParseFails, noKkFails, errors };
    }

    // ===== MIGRATE KTP STATUS — update data lama: umur >= 19 → PUNYA =====
    // Dipanggil oleh admin/petugas untuk update semua DataWarga yang sudah ada di server.
    // Hanya update yang umurnya >= 19 DAN punyaKtp-nya bukan "PUNYA".
    if (operation === "migrateKtpStatus") {
      if (!isStaff) throw new ApiError(status.FORBIDDEN, "Hanya Admin/Petugas yang dapat menjalankan migrasi.");
      const allWarga = await prisma.dataWarga.findMany({
        select: { dataWargaId: true, tanggalLahir: true, punyaKtp: true },
      });
      let updated = 0;
      let skipped = 0;
      for (const w of allWarga) {
        const autoStatus = autoKtpStatus(w.tanggalLahir);
        if (autoStatus === "PUNYA" && w.punyaKtp !== "PUNYA") {
          await prisma.dataWarga.update({
            where: { dataWargaId: w.dataWargaId },
            data: { punyaKtp: "PUNYA" },
          });
          updated++;
        } else {
          skipped++;
        }
      }
      revalidatePath("/data-warga");
      revalidatePath("/dashboard");
      revalidatePath("/");
      return {
        status: 200,
        message: `Migrasi KTP selesai: ${updated} warga diupdate ke PUNYA, ${skipped} warga tidak berubah.`,
        updated,
        skipped,
        total: allWarga.length,
      };
    }

    // ===== UPDATE FOTO KK — simpan URL foto kepala keluarga =====
    if (operation === "updateFotoKk") {
      const { id, fotoKk } = (payload ?? {}) as { id?: string; fotoKk?: string };
      if (!id) throw new ApiError(status.BAD_REQUEST, "ID diperlukan");
      const existing = await prisma.dataWarga.findUnique({ where: { dataWargaId: id } });
      if (!existing) throw new ApiError(status.NOT_FOUND, "Data tidak ditemukan.");
      const bolehKelola = isStaff || existing.userId === session.user.userId || (!!me?.noRt && !!me?.noRw && existing.noRt === me.noRt && existing.noRw === me.noRw);
      if (!bolehKelola) throw new ApiError(status.FORBIDDEN, "Akses ditolak.");
      await prisma.dataWarga.update({
        where: { dataWargaId: id },
        data: { fotoKk: fotoKk || null },
      });
      revalidatePath("/data-warga");
      revalidatePath("/dashboard");
      revalidatePath("/");
      return { status: 200, message: "Foto kepala keluarga berhasil disimpan" };
    }

    return { status: 400, error: "Operasi tidak dikenal" };
  } catch (error) {
    if (error instanceof ApiError) return { status: error.statusCode, error: error.message };
    console.error("ERROR ASLI (pendudukRT):", error);
    return { status: 500, error: "Terjadi kesalahan pada server" };
  }
}
