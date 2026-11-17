'use client';

import { useState, useEffect, useCallback } from 'react';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { LayoutDashboard, Users, UserRound, CalendarDays, Shield, FileSpreadsheet, FileText, Trash2, AlertTriangle, Loader2 } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { FilterWilayah, useOpsiWilayah, pecahFilterWilayah, type OpsiWilayah } from '@/components/filter-wilayah';
import { getStatistikDataWarga } from '@/lib/server/actions/statistik-data-warga';
import { resetDataWilayahAction } from '@/lib/server/actions/reset-data-wilayah';
import PendudukRT from '@/components/data-warga-penduduk';
import PendudukSementaraRT from '@/components/data-warga-sementara';
import PendudukKejadianRT from '@/components/data-warga-kejadian';
import PendudukBansosRT from '@/components/data-warga-bansos';
import TabLaporan from '@/components/data-warga-laporan';
import TabDokumenRT from '@/components/data-warga-dokumen';
import { toast } from 'sonner';

export interface StatistikBeranda {
  totalKK: number;
  totalPenduduk: number;
  pendudukL: number;
  pendudukP: number;
  bayiL: number;
  bayiP: number;
  dptL: number;
  dptP: number;
  ageDist: Record<string, { l: number; p: number }>;
  wajibKTPL: number;
  wajibKTPP: number;
  wajibKTPList: Array<{
    dataWargaId: string;
    noKk: string;
    nik: string;
    namaLengkap: string;
    jenisKelamin: string;
    tempatLahir: string;
    tanggalLahir: string;
    statusKeluarga: string;
    punyaKtp: string;
  }>;
  kkL: number;
  kkP: number;
  sementaraKK: number;
  sementaraL: number;
  sementaraP: number;
  kejadianCounts: Record<string, { l: number; p: number }>;
}

interface ShellProps {
  isStaff: boolean;
  // ADMIN saja: berhak hapus semua data (tombol Reset Data).
  isAdmin?: boolean;
  // ADMIN & RT: boleh kelola data warga — mengaktifkan tombol Tambah/Edit/Hapus di dalam tiap tab.
  canAdd?: boolean;
  initialStatistik: StatistikBeranda | null;
  user: { name: string; noRt: string | null; noRw: string | null; namaKetua: string | null };
  rtInfo: {
    namaRT: string;
    rw: string;
    kelurahan: string;
    kecamatan: string;
    kabupaten: string;
    provinsi: string;
    ketuaRT: string | null;
  };
}

const tabTrigger = 'flex flex-col items-center gap-0.5 py-2 px-1 data-[state=active]:bg-emerald-600 data-[state=active]:text-white rounded-md text-[10px] sm:text-xs';

export default function DataWargaShell({ isStaff, isAdmin = false, canAdd = false, initialStatistik, user, rtInfo }: ShellProps) {
  const [filterWilayah, setFilterWilayah] = useState('SEMUA');
  const { opsi: opsiWilayah } = useOpsiWilayah(isStaff);
  const [statistik, setStatistik] = useState<StatistikBeranda | null>(initialStatistik);
  const [statLoading, setStatLoading] = useState(false);

  // Reset Data state
  const [showResetModal, setShowResetModal] = useState(false);
  const [resetKonfirmasi, setResetKonfirmasi] = useState('');
  const [resetLoading, setResetLoading] = useState(false);

  const fw = pecahFilterWilayah(filterWilayah);

  const refreshStatistik = useCallback(async () => {
    setStatLoading(true);
    try {
      const s = await getStatistikDataWarga(fw.filterRt, fw.filterRw);
      if (s) setStatistik(s as StatistikBeranda);
    } catch (e) {
      console.error('refreshStatistik error', e);
    } finally {
      setStatLoading(false);
    }
  }, [fw.filterRt, fw.filterRw]);

  const handleResetData = async () => {
    if (resetKonfirmasi !== 'HAPUS') {
      toast.error('Ketik "HAPUS" (huruf kapital) untuk konfirmasi.');
      return;
    }
    setResetLoading(true);
    try {
      const r = await resetDataWilayahAction({
        konfirmasi: 'HAPUS',
        filterRt: fw.filterRt,
        filterRw: fw.filterRw,
      });
      if (r.status === 200 && 'data' in r && Array.isArray(r.data)) {
        toast.success(r.message);
        for (const h of r.data as Array<{ tab: string; pesan: string; jumlah: number; status: number }>) {
          if (h.status >= 400) toast.error(`${h.tab}: ${h.pesan}`);
          else if (h.jumlah > 0) toast.message(`${h.tab}: ${h.jumlah} record dihapus`);
        }
        setShowResetModal(false);
        setResetKonfirmasi('');
        setTimeout(() => window.location.reload(), 800);
      } else {
        const errMsg = ('error' in r && typeof r.error === 'string') ? r.error : ('message' in r ? r.message : 'Gagal reset data');
        toast.error(errMsg);
      }
    } catch (e) {
      const msg = e instanceof Error ? e.message : 'Terjadi kesalahan pada server.';
      toast.error(msg);
    } finally {
      setResetLoading(false);
    }
  };

  useEffect(() => {
    if (isStaff && filterWilayah !== 'SEMUA') {
      refreshStatistik();
    } else if (isStaff && filterWilayah === 'SEMUA' && statistik !== initialStatistik) {
      refreshStatistik();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filterWilayah, isStaff]);

  const ageData: { age: string; l: number; p: number }[] = [];
  if (statistik) {
    for (const [key, d] of Object.entries(statistik.ageDist)) {
      if (key === '0-11 BLN') continue;
      if (d.l > 0 || d.p > 0) ageData.push({ age: key, l: d.l, p: d.p });
    }
    ageData.sort((a, b) => Number(a.age) - Number(b.age));
  }

  return (
    <div className='min-h-[80vh] bg-gray-50/50 w-full px-3 sm:px-4 py-4'>
      <div className='max-w-4xl mx-auto space-y-3'>
        <div className='text-center space-y-1 text-white p-4 rounded-xl bg-gradient-to-r from-emerald-700 to-teal-700'>
          <h1 className='text-lg md:text-xl font-bold tracking-wide'>SISTEM DATA KEPENDUDUKAN</h1>
          <h2 className='text-base md:text-lg font-semibold'>RT.{user.noRt ?? '-'} RW.{user.noRw ?? '-'}</h2>
          <div className='flex flex-wrap items-center justify-between gap-1 mt-1'>
            <p className='text-xs opacity-90 min-w-0 break-words'>Ketua RT: {user.namaKetua ?? user.name}</p>
            <span className='text-[10px] opacity-75 bg-white/20 px-2 py-0.5 rounded-full whitespace-nowrap'>
              {user.name}{isStaff ? ' (Admin)' : ' (RT)'}
            </span>
          </div>
        </div>

        <div className='bg-emerald-50 border border-emerald-200 rounded-lg p-2.5 text-center'>
          <p className='text-[11px] text-emerald-800 font-medium'>
            KP. CEMPLANG, KEL. SUKAMAJU, KEC. CIBUNGBULANG, KAB. BOGOR, PROV. JAWA BARAT
          </p>
        </div>

        {/* Tombol "Tambah Warga" di header DIHAPUS — tombol Tambah sudah ada di tiap tab (lebih rapi, tidak redundan).
            canAdd tetap dipakai untuk mengaktifkan tombol Tambah/Edit/Hapus di dalam tiap tab (Penduduk/Sementara/Kejadian/Bantuan). */}

        {/* FILTER GLOBAL + RESET DATA: filter untuk ADMIN/PETUGAS; Reset hanya ADMIN */}
        {isStaff && (
          <div className='flex flex-wrap items-center gap-2 bg-white border rounded-lg p-2 shadow-sm'>
            <span className='text-xs font-semibold text-emerald-700 mr-1'>Filter Wilayah:</span>
            <FilterWilayah opsi={opsiWilayah} value={filterWilayah} onChange={setFilterWilayah} />
            {filterWilayah !== 'SEMUA' && (
              <span className='text-[11px] text-muted-foreground'>
                Menampilkan data RT.{fw.filterRt} RW.{fw.filterRw}
              </span>
            )}
            {statLoading && <span className='text-[11px] text-muted-foreground animate-pulse'>Memuat ulang statistik…</span>}

            {isAdmin && (
              <div className='ml-auto'>
                <Button
                  type='button'
                  variant='destructive'
                  size='sm'
                  onClick={() => { setResetKonfirmasi(''); setShowResetModal(true); }}
                  className='gap-1.5'
                >
                  <Trash2 className='h-4 w-4' />
                  Reset Data {filterWilayah !== 'SEMUA' ? `RT.${fw.filterRt}/RW.${fw.filterRw}` : 'Semua'}
                </Button>
              </div>
            )}
          </div>
        )}

        <Tabs defaultValue='beranda'>
          <div className='overflow-x-auto mb-3'>
            <TabsList className='w-full grid grid-cols-4 sm:grid-cols-7 h-auto bg-white border shadow-sm rounded-lg p-1'>
              <TabsTrigger value='beranda' className={tabTrigger}><LayoutDashboard className='h-4 w-4' /><span>Beranda</span></TabsTrigger>
              <TabsTrigger value='penduduk' className={tabTrigger}><Users className='h-4 w-4' /><span>Penduduk</span></TabsTrigger>
              <TabsTrigger value='sementara' className={tabTrigger}><UserRound className='h-4 w-4' /><span>Sementara</span></TabsTrigger>
              <TabsTrigger value='kejadian' className={tabTrigger}><CalendarDays className='h-4 w-4' /><span>Kejadian</span></TabsTrigger>
              <TabsTrigger value='bantuan' className={tabTrigger}><Shield className='h-4 w-4' /><span>Bansos</span></TabsTrigger>
              <TabsTrigger value='laporan' className={tabTrigger}><FileSpreadsheet className='h-4 w-4' /><span>Laporan</span></TabsTrigger>
              <TabsTrigger value='dokumen' className={tabTrigger}><FileText className='h-4 w-4' /><span>Dokumen</span></TabsTrigger>
            </TabsList>
          </div>

          <TabsContent value='beranda' className='space-y-4'>
            {!statistik ? (
              <Card><CardContent className='p-4 text-center text-sm text-muted-foreground'>Memuat statistik…</CardContent></Card>
            ) : (
              <>
                <div className='grid grid-cols-2 gap-3'>
                  <Card className='bg-emerald-600 text-white border-0'><CardContent className='p-3'>
                    <p className='text-[10px] opacity-80 font-medium'>TOTAL KK</p>
                    <p className='text-2xl font-bold'>{statistik.totalKK}</p>
                    <div className='flex gap-2 mt-1 text-[10px] opacity-80'><span>L: {statistik.kkL}</span><span>P: {statistik.kkP}</span></div>
                  </CardContent></Card>
                  <Card className='bg-teal-600 text-white border-0'><CardContent className='p-3'>
                    <p className='text-[10px] opacity-80 font-medium'>TOTAL PENDUDUK</p>
                    <p className='text-2xl font-bold'>{statistik.totalPenduduk}</p>
                    <div className='flex gap-2 mt-1 text-[10px] opacity-80'><span>L: {statistik.pendudukL}</span><span>P: {statistik.pendudukP}</span></div>
                  </CardContent></Card>
                  <Card className='bg-amber-500 text-white border-0'><CardContent className='p-3'>
                    <p className='text-[10px] opacity-80 font-medium'>BAYI (0-11 BLN)</p>
                    <p className='text-2xl font-bold'>{statistik.bayiL + statistik.bayiP}</p>
                    <div className='flex gap-2 mt-1 text-[10px] opacity-80'><span>L: {statistik.bayiL}</span><span>P: {statistik.bayiP}</span></div>
                  </CardContent></Card>
                  <Card className='bg-rose-500 text-white border-0'><CardContent className='p-3'>
                    <p className='text-[10px] opacity-80 font-medium'>WAJIB KTP (BARU MASUK 17 TH)</p>
                    <p className='text-2xl font-bold'>{statistik.wajibKTPL + statistik.wajibKTPP}</p>
                    <div className='flex gap-2 mt-1 text-[10px] opacity-80'><span>L: {statistik.wajibKTPL}</span><span>P: {statistik.wajibKTPP}</span></div>
                  </CardContent></Card>
                  <Card className='bg-indigo-500 text-white border-0'><CardContent className='p-3'>
                    <p className='text-[10px] opacity-80 font-medium'>DPT (USIA ≥ 17 TH)</p>
                    <p className='text-2xl font-bold'>{statistik.dptL + statistik.dptP}</p>
                    <div className='flex gap-2 mt-1 text-[10px] opacity-80'><span>L: {statistik.dptL}</span><span>P: {statistik.dptP}</span></div>
                  </CardContent></Card>
                  <Card className='bg-violet-500 text-white border-0'><CardContent className='p-3'>
                    <p className='text-[10px] opacity-80 font-medium'>PENDUDUK SEMENTARA</p>
                    <p className='text-2xl font-bold'>{statistik.sementaraKK} KK</p>
                    <p className='text-lg font-semibold'>{statistik.sementaraL + statistik.sementaraP} penduduk</p>
                    <div className='flex gap-2 mt-1 text-[10px] opacity-80'><span>L: {statistik.sementaraL}</span><span>P: {statistik.sementaraP}</span></div>
                  </CardContent></Card>
                </div>

                <Card>
                  <CardContent className='px-4 pb-3 pt-3'>
                    <h3 className='text-sm font-semibold text-emerald-700 mb-2'>Penduduk Wajib KTP (Baru Masuk 17 Tahun)</h3>
                    {statistik.wajibKTPList.length === 0 ? (
                      <p className='text-xs text-muted-foreground text-center py-4'>Tidak ada penduduk yang baru masuk usia 17 tahun</p>
                    ) : (
                      <div className='overflow-x-auto'>
                        <table className='w-full text-[11px]'>
                          <thead><tr className='bg-rose-50 text-rose-700'>
                            <th className='text-left p-2'>No</th><th className='text-left p-2'>No. KK</th><th className='text-left p-2'>NIK</th>
                            <th className='text-left p-2'>Nama</th><th className='text-left p-2'>L/P</th><th className='text-left p-2'>TTL</th>
                            <th className='text-left p-2'>Status Keluarga</th><th className='text-left p-2'>KTP</th>
                          </tr></thead>
                          <tbody>
                            {statistik.wajibKTPList.map((item, idx) => (
                              <tr key={item.dataWargaId} className={idx % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                                <td className='p-2'>{idx + 1}</td>
                                <td className='p-2 font-mono'>{item.noKk}</td>
                                <td className='p-2 font-mono'>{item.nik}</td>
                                <td className='p-2 font-medium'>{item.namaLengkap}</td>
                                <td className='p-2'>{item.jenisKelamin === 'LAKI-LAKI' ? 'L' : 'P'}</td>
                                <td className='p-2'>{item.tempatLahir}, {item.tanggalLahir}</td>
                                <td className='p-2'>{item.statusKeluarga}</td>
                                <td className='p-2'>{item.punyaKtp === 'PUNYA' ? 'Sudah' : 'Belum'}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    )}
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className='px-4 pb-3 pt-3'>
                    <h3 className='text-sm font-semibold text-emerald-700 mb-2'>Kejadian Bulan Ini</h3>
                    <div className='grid grid-cols-2 sm:grid-cols-4 gap-2'>
                      {(['LAHIR', 'MATI', 'PINDAH', 'DATANG'] as const).map((type) => {
                        const d = statistik.kejadianCounts[type] ?? { l: 0, p: 0 };
                        const color = type === 'LAHIR' ? 'text-green-600 bg-green-50' : type === 'MATI' ? 'text-red-600 bg-red-50' : type === 'PINDAH' ? 'text-orange-600 bg-orange-50' : 'text-blue-600 bg-blue-50';
                        return (
                          <div key={type} className={`${color} rounded-lg p-2 text-center`}>
                            <p className='text-[10px] font-semibold'>{type}</p>
                            <p className='text-lg font-bold'>{d.l + d.p}</p>
                            <div className='flex justify-center gap-2 text-[9px]'><span>L: {d.l}</span><span>P: {d.p}</span></div>
                          </div>
                        );
                      })}
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className='px-4 pb-3 pt-3'>
                    <h3 className='text-sm font-semibold text-emerald-700 mb-2'>Distribusi Usia Penduduk</h3>
                    <div className='grid grid-cols-2 gap-1 max-h-72 overflow-y-auto text-[11px]'>
                      {ageData.map((a) => (
                        <div key={a.age} className='flex justify-between p-1 border-b border-gray-50'>
                          <span>Umur {a.age}</span><span className='font-medium'>{a.l} / {a.p}</span>
                        </div>
                      ))}
                      {ageData.length === 0 && <p className='text-muted-foreground col-span-2 text-center'>Belum ada data.</p>}
                    </div>
                  </CardContent>
                </Card>
              </>
            )}
          </TabsContent>

          <TabsContent value='penduduk'><PendudukRT isAdmin={canAdd} wilayah={filterWilayah} /></TabsContent>
          <TabsContent value='sementara'><PendudukSementaraRT isAdmin={canAdd} wilayah={filterWilayah} /></TabsContent>
          <TabsContent value='kejadian'><PendudukKejadianRT isAdmin={canAdd} wilayah={filterWilayah} /></TabsContent>
          <TabsContent value='bantuan'><PendudukBansosRT isAdmin={canAdd} wilayah={filterWilayah} /></TabsContent>
          <TabsContent value='laporan'><TabLaporan wilayah={filterWilayah} /></TabsContent>
          <TabsContent value='dokumen'><TabDokumenRT isAdmin rtInfo={rtInfo} wilayah={filterWilayah} /></TabsContent>
        </Tabs>

        <AlertDialog open={showResetModal} onOpenChange={(o) => { setShowResetModal(o); if (!o) setResetKonfirmasi(''); }}>
          <AlertDialogContent className='max-w-md'>
            <AlertDialogHeader>
              <AlertDialogTitle className='flex items-center gap-2 text-red-700'>
                <AlertTriangle className='h-5 w-5' />
                Konfirmasi Reset Data
              </AlertDialogTitle>
              <AlertDialogDescription asChild>
                <div className='space-y-3 text-sm'>
                  <p className='font-semibold text-red-700'>
                    {filterWilayah === 'SEMUA'
                      ? 'PERHATIAN: Anda akan menghapus SEMUA data di SEMUA RT/RW.'
                      : `PERHATIAN: Anda akan menghapus data milik RT.${fw.filterRt} RW.${fw.filterRw}.`}
                  </p>
                  <p>Operasi ini akan menghapus <b>permanen</b> data di 5 tab berikut:</p>
                  <ul className='list-disc pl-5 space-y-0.5 text-xs'>
                    <li>Penduduk tetap (tabel DataWarga)</li>
                    <li>Penduduk sementara</li>
                    <li>Catatan Kejadian (LAHIR/MATI/PINDAH/DATANG)</li>
                    <li>Penerima Sembako</li>
                    <li>Surat Pengantar (tab Dokumen)</li>
                  </ul>
                  <p className='text-xs text-muted-foreground'>
                    Catatan: <b>Laporan Bulanan</b> (snapshot tersimpan) dan <b>Bansos per KK</b> dari Kemensos tidak ikut dihapus.
                  </p>
                  <p className='text-red-700 font-medium'>
                    Tindakan ini tidak dapat dibatalkan. Pastikan Anda memiliki backup database.
                  </p>
                  <div className='pt-1'>
                    <label className='block text-xs font-medium mb-1'>
                      Ketik <span className='font-mono font-bold tracking-wider'>HAPUS</span> untuk konfirmasi:
                    </label>
                    <Input
                      value={resetKonfirmasi}
                      onChange={(e) => setResetKonfirmasi(e.target.value.toUpperCase())}
                      placeholder='HAPUS'
                      className='font-mono tracking-wider'
                      autoComplete='off'
                      disabled={resetLoading}
                    />
                  </div>
                </div>
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel disabled={resetLoading}>Batal</AlertDialogCancel>
              <AlertDialogAction
                onClick={handleResetData}
                disabled={resetKonfirmasi !== 'HAPUS' || resetLoading}
                className='bg-red-600 hover:bg-red-700 text-white disabled:opacity-40 disabled:cursor-not-allowed'
              >
                {resetLoading ? (
                  <><Loader2 className='h-4 w-4 mr-1 animate-spin' /> Memproses…</>
                ) : (
                  <><Trash2 className='h-4 w-4 mr-1' /> Hapus Sekarang</>
                )}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </div>
  );
}

export type { OpsiWilayah };
