"use server";

import { revalidatePath } from "next/cache";
import { ApiError } from "next/dist/server/api-utils";
import status from "http-status";
import { prisma } from "@/lib/prisma";
import { findCurrentSessionService } from "../services/session";
import { toUpperCase, autoKtpStatus } from "../utils/kependudukan";

const getSession = async () => {
  const s = await findCurrentSessionService();
  if (!s?.user) throw new ApiError(status.UNAUTHORIZED, "Anda belum masuk.");
  return s;
};

const staffOnly = async () => {
  const s = await getSession();
  if (s.user.role !== "ADMIN" && s.user.role !== "PETUGAS") {
    throw new ApiError(status.FORBIDDEN, "Hanya admin dan petugas yang dapat mengakses.");
  }
  return s;
};

// ===== Marker untuk simpan snapshot warga di keterangan (tidak perlu migrasi DB) =====
// Format keterangan: "<user_text>\n__WARGA_SNAPSHOT__:<json>\n__AUTO_CREATED_WARGA__:true"
// Saat display ke user, strip marker. Saat delete kejadian, parse marker untuk revert side effects.
const SNAPSHOT_MARKER = "__WARGA_SNAPSHOT__:";
const AUTO_CREATED_MARKER = "__AUTO_CREATED_WARGA__:";

type WargaSnapshot = {
  table: "DataWarga" | "PendudukSementara";
  data: Record<string, unknown>;
};

function encodeKeterangan(
  userKet: string | null,
  snapshot: WargaSnapshot | null,
  autoCreated: boolean
): string | null {
  let result = (userKet ?? "").trim();
  if (snapshot) {
    if (result) result += "\n";
    result += SNAPSHOT_MARKER + JSON.stringify(snapshot);
  }
  if (autoCreated) {
    if (result) result += "\n";
    result += AUTO_CREATED_MARKER + "true";
  }
  return result || null;
}

function decodeKeterangan(ket: string | null): {
  userText: string | null;
  snapshot: WargaSnapshot | null;
  autoCreated: boolean;
} {
  if (!ket) return { userText: null, snapshot: null, autoCreated: false };
  const lines = ket.split("\n");
  const userTextLines: string[] = [];
  let snapshot: WargaSnapshot | null = null;
  let autoCreated = false;
  for (const line of lines) {
    if (line.startsWith(SNAPSHOT_MARKER)) {
      try {
        snapshot = JSON.parse(line.substring(SNAPSHOT_MARKER.length)) as WargaSnapshot;
      } catch {
        // ignore parse error
      }
    } else if (line.startsWith(AUTO_CREATED_MARKER)) {
      autoCreated = true;
    } else {
      userTextLines.push(line);
    }
  }
  return {
    userText: userTextLines.join("\n").trim() || null,
    snapshot,
    autoCreated,
  };
}

// Strip field auto-generated supaya bisa di-restore sebagai record baru
function stripAutoFields(data: Record<string, unknown>, table: "DataWarga" | "PendudukSementara"): Record<string, unknown> {
  const cleaned = { ...data };
  delete cleaned.dataWargaId;
  delete cleaned.pendudukSementaraId;
  delete cleaned.createdAt;
  delete cleaned.updatedAt;
  // Hapus juga id kalau ada (untuk PendudukSementara)
  if (table === "PendudukSementara") delete cleaned.id;
  return cleaned;
}

export async function kejadianRTAction(operation: string, payload?: unknown) {
  try {
    const session = await getSession();
    const isStaff = session.user.role === "ADMIN" || session.user.role === "PETUGAS";
    const me = await prisma.user.findUnique({ where: { userId: session.user.userId } });

    // Kunci wilayah untuk Ketua RT (filter berdasarkan noKk milik RT-nya)
    const kunciWilayah = async (): Promise<Record<string, unknown>> => {
      if (isStaff) return {};
      if (me?.noRt && me?.noRw) {
        const [tetap, sem] = await Promise.all([
          prisma.dataWarga.findMany({ where: { noRt: me.noRt, noRw: me.noRw }, select: { noKk: true }, distinct: ["noKk"] }),
          prisma.pendudukSementara.findMany({ where: { noRt: me.noRt, noRw: me.noRw }, select: { noKk: true }, distinct: ["noKk"] }),
        ]);
        const kkWilayah = new Set<string>();
        for (const k of [...tetap, ...sem]) if (k.noKk) kkWilayah.add(k.noKk);
        return { OR: [{ userId: session.user.userId }, { noKk: { in: Array.from(kkWilayah) } }] };
      }
      return { userId: session.user.userId };
    };

    const filterWilayahStaff = async (filterRt?: string, filterRw?: string): Promise<Record<string, unknown>> => {
      const cond: Record<string, unknown> = {};
      if (filterRt && filterRt !== "SEMUA") cond.noRt = String(filterRt);
      if (filterRw && filterRw !== "SEMUA") cond.noRw = String(filterRw);
      if (!cond.noRt && !cond.noRw) return {};
      const [tetap, sem] = await Promise.all([
        prisma.dataWarga.findMany({ where: cond, select: { noKk: true }, distinct: ["noKk"] }),
        prisma.pendudukSementara.findMany({ where: cond, select: { noKk: true }, distinct: ["noKk"] }),
      ]);
      const kkWilayah = new Set<string>();
      for (const k of [...tetap, ...sem]) if (k.noKk) kkWilayah.add(k.noKk);
      return { noKk: { in: Array.from(kkWilayah) } };
    };

    // ===== LIST =====
    if (operation === "list") {
      const { jenis, bulan, tahun, filterRt, filterRw } = (payload ?? {}) as { jenis?: string; bulan?: string; tahun?: string; filterRt?: string; filterRw?: string };
      const where: Record<string, unknown> = {
        ...(await kunciWilayah()),
        ...(isStaff ? await filterWilayahStaff(filterRt, filterRw) : {}),
      };
      if (jenis) where.jenisKejadian = jenis;
      if (bulan && tahun) {
        const startDate = new Date(parseInt(tahun), parseInt(bulan) - 1, 1);
        const endDate = new Date(parseInt(tahun), parseInt(bulan), 0, 23, 59, 59);
        where.tanggal = { gte: startDate, lte: endDate };
      }
      const data = await prisma.kejadian.findMany({ where, orderBy: { tanggal: "desc" } });
      return { status: 200, data };
    }

    // ===== CREATE (dengan side effects ke penduduk + snapshot di keterangan) =====
    if (operation === "create") {
      const d = (payload ?? {}) as Record<string, unknown>;
      const jenis = toUpperCase(String(d.jenisKejadian ?? ""));
      const noKK = String(d.noKK ?? "");
      const nik = String(d.nik ?? "");
      const namaLengkap = String(d.namaLengkap ?? "");
      const tanggalStr = String(d.tanggal ?? "");
      if (!jenis || !namaLengkap || !tanggalStr) {
        throw new ApiError(status.BAD_REQUEST, "Jenis kejadian, nama, dan tanggal wajib diisi.");
      }
      const tanggal = new Date(tanggalStr);

      let wargaSnapshot: WargaSnapshot | null = null;
      let autoCreatedWarga = false;

      // --- Side effect per jenis ---

      // MATI: simpan snapshot warga sebelum hapus (supaya bisa di-restore saat kejadian dihapus)
      if (jenis === "MATI" && nik) {
        const tetap = await prisma.dataWarga.findFirst({ where: { nik } });
        if (tetap) {
          wargaSnapshot = { table: "DataWarga", data: tetap as unknown as Record<string, unknown> };
          await prisma.dataWarga.deleteMany({ where: { nik } });
        } else {
          const sem = await prisma.pendudukSementara.findFirst({ where: { nik } });
          if (sem) {
            wargaSnapshot = { table: "PendudukSementara", data: sem as unknown as Record<string, unknown> };
            await prisma.pendudukSementara.deleteMany({ where: { nik } });
          }
        }
      }

      // PINDAH: sama seperti MATI — simpan snapshot sebelum hapus
      if (jenis === "PINDAH" && nik) {
        const tetap = await prisma.dataWarga.findFirst({ where: { nik } });
        if (tetap) {
          wargaSnapshot = { table: "DataWarga", data: tetap as unknown as Record<string, unknown> };
          await prisma.dataWarga.deleteMany({ where: { nik } });
        } else {
          const sem = await prisma.pendudukSementara.findFirst({ where: { nik } });
          if (sem) {
            wargaSnapshot = { table: "PendudukSementara", data: sem as unknown as Record<string, unknown> };
            await prisma.pendudukSementara.deleteMany({ where: { nik } });
          }
        }
      }

      // LAHIR: auto-create warga baru + set autoCreated flag
      if (jenis === "LAHIR" && nik && namaLengkap) {
        const finalNoKK = String(d.noKKBaru ?? "") || noKK;
        let namaAyah = "-", namaIbu = "-";
        if (finalNoKK) {
          const kkHead = await prisma.dataWarga.findFirst({ where: { noKk: finalNoKK, statusKeluarga: "KEPALA KELUARGA" } });
          if (kkHead) namaAyah = kkHead.namaLengkap || "-";
          const istri = await prisma.dataWarga.findFirst({ where: { noKk: finalNoKK, jenisKelamin: "PEREMPUAN" } });
          if (istri) namaIbu = istri.namaLengkap || "-";
        }
        const sudahAda = await prisma.dataWarga.findUnique({ where: { nik } });
        if (!sudahAda) {
          await prisma.dataWarga.create({
            data: {
              userId: session.user.userId, noKk: finalNoKK, nik,
              namaLengkap: toUpperCase(namaLengkap),
              jenisKelamin: toUpperCase(String(d.jenisKelamin ?? "")) || "LAKI-LAKI",
              statusKeluarga: "ANAK",
              tempatLahir: toUpperCase(String(d.tempatLahir ?? "-")),
              tanggalLahir: d.tanggalLahir ? new Date(String(d.tanggalLahir)) : tanggal,
              agama: "ISLAM", pendidikan: "TIDAK/BELUM SEKOLAH",
              pekerjaan: "BELUM/TIDAK BEKERJA", statusPerkawinan: "BELUM MENIKAH",
              namaAyah, namaIbu, punyaKtp: "BELUM",
              noRt: me?.noRt ?? "001", noRw: me?.noRw ?? "002",
            },
          });
          autoCreatedWarga = true;
        }
      }

      // DATANG: auto-create anggota baru + set autoCreated flag
      if (jenis === "DATANG") {
        const anggotaBaru = (d.anggotaBaru ?? []) as Array<Record<string, unknown>>;
        const finalNoKK = String(d.noKKBaru ?? "") || noKK;
        let adaYangDiCreate = false;
        for (const a of anggotaBaru) {
          if (!a.nik || !a.namaLengkap) continue;
          const sudahAda = await prisma.dataWarga.findUnique({ where: { nik: String(a.nik) } });
          if (sudahAda) continue;
          await prisma.dataWarga.create({
            data: {
              userId: session.user.userId, noKk: finalNoKK,
              nik: String(a.nik), namaLengkap: toUpperCase(String(a.namaLengkap)),
              jenisKelamin: toUpperCase(String(a.jenisKelamin ?? "")) || "LAKI-LAKI",
              statusKeluarga: toUpperCase(String(a.statusKeluarga ?? "")) || "LAINNYA",
              tempatLahir: toUpperCase(String(a.tempatLahir ?? "-")),
              tanggalLahir: a.tanggalLahir ? new Date(String(a.tanggalLahir)) : tanggal,
              agama: toUpperCase(String(a.agama ?? "")) || "ISLAM",
              pendidikan: toUpperCase(String(a.pendidikan ?? "")) || "TIDAK/BELUM SEKOLAH",
              pekerjaan: toUpperCase(String(a.pekerjaan ?? "")) || "BELUM/TIDAK BEKERJA",
              statusPerkawinan: toUpperCase(String(a.statusPerkawinan ?? "")) || "BELUM MENIKAH",
              namaAyah: toUpperCase(String(a.namaAyah ?? "")) || "-",
              namaIbu: toUpperCase(String(a.namaIbu ?? "")) || "-",
              // Auto-fill KTP: umur >= 19 → PUNYA
              punyaKtp: (() => {
                const tgl = a.tanggalLahir ? new Date(String(a.tanggalLahir)) : tanggal;
                return autoKtpStatus(tgl);
              })(),
              noRt: me?.noRt ?? "001", noRw: me?.noRw ?? "002",
            },
          });
          adaYangDiCreate = true;
        }
        if (adaYangDiCreate) autoCreatedWarga = true;
      }

      // Simpan catatan kejadian dengan keterangan yang berisi snapshot/marker (untuk revert saat delete)
      const keteranganEncoded = encodeKeterangan(
        (d.keterangan as string) || null,
        wargaSnapshot,
        autoCreatedWarga
      );

      const data = await prisma.kejadian.create({
        data: {
          userId: session.user.userId,
          jenisKejadian: jenis,
          noKk: String(d.noKKBaru ?? "") || noKK || "",
          namaLengkap: toUpperCase(namaLengkap),
          nik: nik || null,
          jenisKelamin: toUpperCase(String(d.jenisKelamin ?? "")) || "",
          tanggal,
          keterangan: keteranganEncoded,
        },
      });
      revalidatePath("/data-warga");
      // Revalidate beranda (dashboard + public) supaya statistik langsung update tanpa manual refresh
      revalidatePath("/dashboard");
      revalidatePath("/");
      return { status: 200, message: `Kejadian ${jenis} berhasil dicatat`, data };
    }

    // ===== UPDATE (preserve snapshot/marker saat user edit keterangan) =====
    if (operation === "update") {
      const { id, ...d } = (payload ?? {}) as Record<string, unknown>;
      if (!id) throw new ApiError(status.BAD_REQUEST, "ID diperlukan");
      const existing = await prisma.kejadian.findUnique({ where: { kejadianId: String(id) } });
      if (!existing) throw new ApiError(status.NOT_FOUND, "Kejadian tidak ditemukan.");
      if (!isStaff && existing.userId !== session.user.userId) throw new ApiError(status.FORBIDDEN, "Akses ditolak.");

      // Decode keterangan existing untuk preserve snapshot/marker
      const decoded = decodeKeterangan(existing.keterangan);

      const u: Record<string, unknown> = {};
      if (d.keterangan !== undefined) {
        // Ganti hanya user text, preserve snapshot & autoCreated marker
        u.keterangan = encodeKeterangan(
          (d.keterangan as string) || null,
          decoded.snapshot,
          decoded.autoCreated
        );
      }
      if (d.tanggal !== undefined) u.tanggal = new Date(String(d.tanggal));
      const data = await prisma.kejadian.update({ where: { kejadianId: String(id) }, data: u });
      revalidatePath("/data-warga");
      // Revalidate beranda (dashboard + public) supaya statistik langsung update tanpa manual refresh
      revalidatePath("/dashboard");
      revalidatePath("/");
      return { status: 200, message: "Kejadian berhasil diupdate", data };
    }

    // ===== DELETE — REVERT SIDE EFFECTS supaya jumlah penduduk & laporan tidak terpengaruh =====
    // Logika revert:
    //   - MATI/PINDAH: restore warga dari snapshot (kalau belum ada di DB)
    //   - LAHIR/DATANG: hapus warga yang di-create oleh kejadian ini (kalau tidak ada kejadian lain untuk NIK tsb. setelahnya)
    //   - Kejadian record tetap dihapus
    if (operation === "delete") {
      const { id } = (payload ?? {}) as { id?: string };
      if (!id) throw new ApiError(status.BAD_REQUEST, "ID diperlukan");
      const existing = await prisma.kejadian.findUnique({ where: { kejadianId: String(id) } });
      if (!existing) throw new ApiError(status.NOT_FOUND, "Kejadian tidak ditemukan.");
      if (!isStaff && existing.userId !== session.user.userId) throw new ApiError(status.FORBIDDEN, "Akses ditolak.");

      const decoded = decodeKeterangan(existing.keterangan);
      const jenis = toUpperCase(existing.jenisKejadian);
      let restoreMsg = "";

      // MATI/PINDAH: restore warga dari snapshot
      if ((jenis === "MATI" || jenis === "PINDAH") && decoded.snapshot) {
        const snap = decoded.snapshot;
        const dataToRestore = stripAutoFields(snap.data, snap.table);
        const nikToRestore = String(dataToRestore.nik ?? "");

        if (nikToRestore) {
          if (snap.table === "DataWarga") {
            const sudahAda = await prisma.dataWarga.findUnique({ where: { nik: nikToRestore } });
            if (!sudahAda) {
              await prisma.dataWarga.create({ data: dataToRestore as never });
              restoreMsg = " (data warga dikembalikan)";
            } else {
              restoreMsg = " (warga sudah ada, tidak dikembalikan)";
            }
          } else if (snap.table === "PendudukSementara") {
            // PendudukSementara tidak punya unique constraint nik, jadi cek dulu
            const sudahAda = await prisma.pendudukSementara.findFirst({ where: { nik: nikToRestore } });
            if (!sudahAda) {
              await prisma.pendudukSementara.create({ data: dataToRestore as never });
              restoreMsg = " (data penduduk sementara dikembalikan)";
            } else {
              restoreMsg = " (penduduk sementara sudah ada, tidak dikembalikan)";
            }
          }
        }
      }

      // LAHIR/DATANG: hapus warga yang di-create oleh kejadian ini
      // Hanya hapus kalau TIDAK ada kejadian lain (MATI/PINDAH/LAHIR/DATANG) untuk NIK tsb.
      // setelah kejadian ini dibuat. Ini mencegah hapus warga yang masih dirujuk kejadian lain.
      if ((jenis === "LAHIR" || jenis === "DATANG") && decoded.autoCreated && existing.nik) {
        const kejadianLainUntukNik = await prisma.kejadian.findMany({
          where: {
            nik: existing.nik,
            kejadianId: { not: existing.kejadianId },
            tanggal: { gt: existing.tanggal },
          },
          select: { kejadianId: true },
        });

        if (kejadianLainUntukNik.length === 0) {
          // Tidak ada kejadian lain setelah ini untuk NIK tsb. → aman untuk hapus warga
          // Untuk DATANG, mungkin ada beberapa anggota yang di-create. Hapus semua berdasarkan noKk + tanggal kejadian.
          if (jenis === "DATANG") {
            // Hapus warga yang noKk-nya sama dengan kejadian ini DAN baru di-create sekitar tanggal kejadian
            const noKkKejadian = existing.noKk;
            if (noKkKejadian) {
              const tanggalKejadian = existing.tanggal;
              const batasAtas = new Date(tanggalKejadian.getTime() + 60 * 60 * 1000); // +1 jam toleransi
              await prisma.dataWarga.deleteMany({
                where: {
                  noKk: noKkKejadian,
                  createdAt: { gte: tanggalKejadian, lte: batasAtas },
                },
              }).catch(() => {});
            }
          } else {
            // LAHIR: hapus warga by NIK
            await prisma.dataWarga.deleteMany({ where: { nik: existing.nik } }).catch(() => {});
          }
          restoreMsg = " (warga yang di-create otomatis dihapus)";
        } else {
          restoreMsg = " (warga tidak dihapus — masih dirujuk kejadian lain)";
        }
      }

      await prisma.kejadian.delete({ where: { kejadianId: String(id) } });
      revalidatePath("/data-warga");
      // Revalidate beranda (dashboard + public) supaya statistik langsung update tanpa manual refresh
      revalidatePath("/dashboard");
      revalidatePath("/");
      return { status: 200, message: `Kejadian berhasil dihapus${restoreMsg}` };
    }

    // ===== DELETE ALL (konfirmasi ketik HAPUS) =====
    // Hapus bulk TIDAK revert side effects (terlalu kompleks untuk bulk). Hanya hapus kejadian record.
    // Untuk restore warga, admin bisa hapus per-kejadian (yang akan trigger revert).
    if (operation === "deleteAll") {
      const { konfirmasi, filterRt, filterRw } = (payload ?? {}) as { konfirmasi?: string; filterRt?: string; filterRw?: string };
      if (konfirmasi !== "HAPUS") throw new ApiError(status.BAD_REQUEST, "Ketik HAPUS untuk konfirmasi.");
      const where: Record<string, unknown> = {
        ...(await kunciWilayah()),
        ...(isStaff ? await filterWilayahStaff(filterRt, filterRw) : {}),
      };
      const jumlah = await prisma.kejadian.count({ where });
      await prisma.kejadian.deleteMany({ where });
      revalidatePath("/data-warga");
      // Revalidate beranda (dashboard + public) supaya statistik langsung update tanpa manual refresh
      revalidatePath("/dashboard");
      revalidatePath("/");
      return { status: 200, message: `Data kejadian berhasil dihapus (${jumlah} catatan)`, jumlah };
    }

    return { status: 400, error: "Operasi tidak dikenal" };
  } catch (error) {
    if (error instanceof ApiError) return { status: error.statusCode, error: error.message };
    console.error("ERROR ASLI (kejadianRT):", error);
    return { status: 500, error: "Terjadi kesalahan pada server." };
  }
}
