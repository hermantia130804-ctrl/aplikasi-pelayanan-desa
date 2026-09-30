import { PerbaikanDesilTindakLanjut } from "@/components/perbaikan-desil-tindak-lanjut";
import { PerbaikanDesilDeleteButton } from "@/components/perbaikan-desil-delete-button";
import { findPerbaikanDesilByIdAction } from "@/lib/server/actions/perbaikan-desil";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ArrowLeftIcon } from "lucide-react";
import Link from "next/link";
import { notFound } from "next/navigation";
import moment from "moment";

export const dynamic = "force-dynamic";

function Baris({ label, value }: { label: string; value?: string | number | null }) {
    if (value === undefined || value === null || value === "") return null;
    return (
        <div className="flex flex-col gap-0.5 border-b py-2 sm:flex-row sm:items-center sm:justify-between">
            <span className="text-sm text-muted-foreground">{label}</span>
            <span className="text-sm font-medium">{value}</span>
        </div>
    );
}

export default async function KelolaPerbaikanDesilDetailPage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = await params;
    const res = await findPerbaikanDesilByIdAction(id);
    if (res.status !== 200) notFound();
    const d = res.data;
    const j = (d.jawaban ?? {}) as Record<string, unknown>;
    const urls = (d.fotoUrls ?? []) as string[];

    return (
        <div className="flex flex-1 flex-col">
            <div className="@container/main flex flex-1 flex-col gap-2">
                <div className="flex flex-col gap-4 py-4 md:gap-6 md:py-6 px-4 lg:px-6">
                    <Button asChild variant="outline" className="w-fit">
                        <Link href="/kelola-perbaikan-desil"><ArrowLeftIcon className="w-4 h-4" /> Kembali</Link>
                    </Button>
                    <div className="flex items-center justify-between">
                        <h1 className="text-2xl font-bold">{d.nomorPermohonan}</h1>
                        <Badge>{d.statusPermohonan}</Badge>
                    </div>
                    <div className="flex justify-end">
                        <PerbaikanDesilDeleteButton perbaikanDesilId={d.perbaikanDesilId} />
                    </div>
                    <p className="text-muted-foreground -mt-2 text-sm">
                        Pemohon: {d.user?.name ?? "-"} ({d.user?.email ?? "-"}) · Diajukan {moment(d.createdAt).format("DD MMMM YYYY HH:mm")}
                    </p>
                    {d.catatan && (
                        <div className="rounded-xl border bg-muted/40 p-4 text-sm">
                            <span className="font-semibold">Catatan saat ini: </span>{d.catatan}
                        </div>
                    )}

                    <div className="rounded-2xl border bg-card p-5">
                        <h2 className="mb-2 font-bold">1. Identitas Keluarga</h2>
                        <Baris label="Nama Kepala Keluarga" value={d.namaKk} />
                        <Baris label="NIK" value={d.nikKk} />
                        <Baris label="No. Kartu Keluarga" value={d.noKk} />
                        <Baris label="Jumlah Anggota" value={d.jumlahAnggota} />
                        <Baris label="Alamat" value={`${d.alamat}, ${d.namaJalan} No. ${d.noRumah}`} />
                    </div>

                    <div className="rounded-2xl border bg-card p-5">
                        <h2 className="mb-2 font-bold">2. Keterangan Sosial Ekonomi</h2>
                        <Baris label="Jenis bangunan" value={j.jenisBangunan as string} />
                        <Baris label="Tinggal bersama keluarga lain" value={j.tinggalBersamaKeluargaLain as string} />
                        <Baris label="Jumlah penghuni" value={j.jumlahPenghuni as number} />
                        <Baris label="Status kepemilikan" value={j.statusKepemilikan as string} />
                        <Baris label="Bukti tanah" value={j.buktiTanah as string} />
                        <Baris label="Harga sewa/bulan" value={j.hargaSewaBulan as number} />
                        <Baris label="Luas lantai (m²)" value={j.luasLantai as number} />
                        <Baris label="Jenis lantai" value={j.jenisLantai as string} />
                        <Baris label="Kondisi lantai" value={j.kondisiLantai as string} />
                        <Baris label="Jenis dinding" value={j.jenisDinding as string} />
                        <Baris label="Kondisi dinding" value={j.kondisiDinding as string} />
                        <Baris label="Jenis atap" value={j.jenisAtap as string} />
                        <Baris label="Kondisi atap" value={j.kondisiAtap as string} />
                        <Baris label="Fasilitas BAB" value={j.fasilitasBAB as string} />
                        <Baris label="Jenis kloset" value={j.jenisKloset as string} />
                        <Baris label="Buangan tinja" value={j.buanganTinja as string} />
                        <Baris label="Sumber air minum" value={j.sumberAir as string} />
                        <Baris label="Sumber penerangan" value={j.sumberPenerangan as string} />
                        <Baris label="Jumlah meteran listrik" value={j.jumlahMeteran as number} />
                        <Baris label="Daya listrik" value={j.dayaListrik as string} />
                        <Baris label="ID Pelanggan PLN" value={j.idPelangganPln as string} />
                        <Baris label="Pengeluaran listrik/bulan" value={j.pengeluaranListrik as number} />
                        <Baris label="Pengeluaran internet/bulan" value={j.pengeluaranInternet as number} />
                        <Baris label="Pengeluaran makanan/minggu" value={j.pengeluaranMakananMingguan as number} />
                        <Baris label="Bukan makanan/bulan" value={j.pengeluaranBukanMakananBulanan as number} />
                        <Baris label="Bukan makanan/tahun" value={j.pengeluaranBukanMakananTahunan as number} />
                    </div>

                    <div className="rounded-2xl border bg-card p-5">
                        <h2 className="mb-2 font-bold">3. Kepemilikan Aset</h2>
                        <Baris label="Tabung Gas 3 KG" value={j.asetGas3kg as number} />
                        <Baris label="Tabung Gas 5,5 KG+" value={j.asetGas55kg as number} />
                        <Baris label="Kulkas" value={j.asetKulkas as number} />
                        <Baris label="AC" value={j.asetAc as number} />
                        <Baris label="Emas/Perhiasan" value={j.asetEmas as number} />
                        <Baris label="Komputer/Laptop/Tablet" value={j.asetKomputer as number} />
                        <Baris label="Sepeda Motor" value={j.asetMotor as number} />
                        <Baris label="Mobil" value={j.asetMobil as number} />
                        <Baris label="Rumah/Bangunan lain" value={j.asetRumahLain as string} />
                        <Baris label="Lahan lainnya" value={j.asetLahanLain as number} />
                    </div>

                    <div className="rounded-2xl border bg-card p-5">
                        <h2 className="mb-3 font-bold">Foto Rumah (dapat diunduh)</h2>
                        {urls.length === 0 ? (
                            <p className="text-sm text-muted-foreground">Tidak ada foto.</p>
                        ) : (
                            <>
                                <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
                                    {urls.map((_, i) => (
                                        <a key={i} href={`/api/berkas-desil?id=${d.perbaikanDesilId}&i=${i}`} target="_blank" rel="noopener noreferrer">
                                            {/* eslint-disable-next-line @next/next/no-img-element */}
                                            <img
                                                src={`/api/berkas-desil?id=${d.perbaikanDesilId}&i=${i}`}
                                                alt={`Foto rumah ${i + 1}`}
                                                className="h-28 w-full rounded-lg border object-cover"
                                            />
                                        </a>
                                    ))}
                                </div>
                                <div className="mt-4 flex flex-wrap gap-2">
                                    {urls.map((_, i) => (
                                        <a
                                            key={i}
                                            href={`/api/berkas-desil?id=${d.perbaikanDesilId}&i=${i}&download=1`}
                                            download
                                            className="rounded-md border px-3 py-1.5 text-xs font-medium hover:bg-muted"
                                        >
                                            ⬇ Unduh Foto {i + 1}
                                        </a>
                                    ))}
                                </div>
                            </>
                        )}
                    </div>

                    <PerbaikanDesilTindakLanjut
                        perbaikanDesilId={d.perbaikanDesilId}
                        statusPermohonan={d.statusPermohonan}
                        catatan={d.catatan ?? ""}
                    />
                </div>
            </div>
        </div>
    );
}
