import Link from "next/link";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { LayoutDashboard, Users, UserRound, CalendarDays, Shield, FileSpreadsheet, FileText } from "lucide-react";
import { findCurrentSessionService } from "@/lib/server/services/session";
import { getStatistikDataWarga } from "@/lib/server/actions/statistik-data-warga";
import { Button } from "@/components/ui/button";
import { PlusCircle } from "lucide-react";
import { redirect } from "next/navigation";
import { Card, CardContent } from "@/components/ui/card";

export const dynamic = "force-dynamic";

function Baris({ label, value }: { label: string; value?: string | number | null }) {
    if (value === undefined || value === null || value === "") return null;
    return (<div className="flex flex-col gap-0.5 border-b py-2 sm:flex-row sm:items-center sm:justify-between">
        <span className="text-sm text-muted-foreground">{label}</span>
        <span className="text-sm font-medium">{value}</span>
    </div>);
}

const tabTrigger = "flex flex-col items-center gap-0.5 py-2 px-1 data-[state=active]:bg-emerald-600 data-[state=active]:text-white rounded-md text-[10px] sm:text-xs";

export default async function DataWargaPage() {
    const session = await findCurrentSessionService();
    if (!session?.user) redirect("/masuk");
    const isStaff = session.user.role === "ADMIN" || session.user.role === "PETUGAS";
    const u = await prismaUser(session.user.userId);

    const statistik = await getStatistikDataWarga();
    if (!statistik) redirect("/masuk");

    const ageData: { age: string; l: number; p: number }[] = [];
    for (const [key, d] of Object.entries(statistik.ageDist)) {
        if (key === "0-11 BLN") continue;
        if (d.l > 0 || d.p > 0) ageData.push({ age: key, l: d.l, p: d.p });
    }
    ageData.sort((a, b) => Number(a.age) - Number(b.age));

    return (
        <div className="min-h-[80vh] bg-gray-50/50 -mx-4 sm:-mx-6 px-2 sm:px-4 py-4">
            <div className="max-w-4xl mx-auto space-y-3">
                <div className="text-center space-y-1 text-white p-4 rounded-xl bg-gradient-to-r from-emerald-700 to-teal-700">
                    <h1 className="text-lg md:text-xl font-bold tracking-wide">SISTEM DATA KEPENDUDUKAN</h1>
                    <h2 className="text-base md:text-lg font-semibold">RT.{u?.noRt ?? "-"} RW.{u?.noRw ?? "-"}</h2>
                    <div className="flex items-center justify-between mt-1">
                        <p className="text-xs opacity-90">Ketua RT: {u?.namaKetua ?? session.user.name}</p>
                        <span className="text-[10px] opacity-75 bg-white/20 px-2 py-0.5 rounded-full">{session.user.name}{isStaff ? " (Admin)" : " (RT)"}</span>
                    </div>
                </div>

                <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-2.5 text-center">
                    <p className="text-[11px] text-emerald-800 font-medium">KP. CEMPLANG, KEL. SUKAMAJU, KEC. CIBUNGBULANG, KAB. BOGOR, PROV. JAWA BARAT</p>
                </div>

                <Tabs defaultValue="beranda">
                    <div className="overflow-x-auto mb-3">
                        <TabsList className="w-full grid grid-cols-4 sm:grid-cols-7 h-auto bg-white border shadow-sm rounded-lg p-1">
                            <TabsTrigger value="beranda" className={tabTrigger}><LayoutDashboard className="h-4 w-4" /><span>Beranda</span></TabsTrigger>
                            <TabsTrigger value="penduduk" className={tabTrigger}><Users className="h-4 w-4" /><span>Penduduk</span></TabsTrigger>
                            <TabsTrigger value="sementara" className={tabTrigger}><UserRound className="h-4 w-4" /><span>Sementara</span></TabsTrigger>
                            <TabsTrigger value="kejadian" className={tabTrigger}><CalendarDays className="h-4 w-4" /><span>Kejadian</span></TabsTrigger>
                            <TabsTrigger value="bantuan" className={tabTrigger}><Shield className="h-4 w-4" /><span>Bansos</span></TabsTrigger>
                            <TabsTrigger value="laporan" className={tabTrigger}><FileSpreadsheet className="h-4 w-4" /><span>Laporan</span></TabsTrigger>
                            <TabsTrigger value="dokumen" className={tabTrigger}><FileText className="h-4 w-4" /><span>Dokumen</span></TabsTrigger>
                        </TabsList>
                    </div>

                    <TabsContent value="beranda" className="space-y-4">
                        <div className="grid grid-cols-2 gap-3">
                            <Card className="bg-emerald-600 text-white border-0"><CardContent className="p-3">
                                <p className="text-[10px] opacity-80 font-medium">TOTAL KK</p>
                                <p className="text-2xl font-bold">{statistik.totalKK}</p>
                                <div className="flex gap-2 mt-1 text-[10px] opacity-80"><span>L: {statistik.kkL}</span><span>P: {statistik.kkP}</span></div>
                            </CardContent></Card>
                            <Card className="bg-teal-600 text-white border-0"><CardContent className="p-3">
                                <p className="text-[10px] opacity-80 font-medium">TOTAL PENDUDUK</p>
                                <p className="text-2xl font-bold">{statistik.totalPenduduk}</p>
                                <div className="flex gap-2 mt-1 text-[10px] opacity-80"><span>L: {statistik.pendudukL}</span><span>P: {statistik.pendudukP}</span></div>
                            </CardContent></Card>
                            <Card className="bg-amber-500 text-white border-0"><CardContent className="p-3">
                                <p className="text-[10px] opacity-80 font-medium">BAYI (0-11 BLN)</p>
                                <p className="text-2xl font-bold">{statistik.bayiL + statistik.bayiP}</p>
                                <div className="flex gap-2 mt-1 text-[10px] opacity-80"><span>L: {statistik.bayiL}</span><span>P: {statistik.bayiP}</span></div>
                            </CardContent></Card>
                            <Card className="bg-rose-500 text-white border-0"><CardContent className="p-3">
                                <p className="text-[10px] opacity-80 font-medium">WAJIB KTP (BARU MASUK 17 TH)</p>
                                <p className="text-2xl font-bold">{statistik.wajibKTPL + statistik.wajibKTPP}</p>
                                <div className="flex gap-2 mt-1 text-[10px] opacity-80"><span>L: {statistik.wajibKTPL}</span><span>P: {statistik.wajibKTPP}</span></div>
                            </CardContent></Card>
                            <Card className="bg-indigo-500 text-white border-0"><CardContent className="p-3">
                                <p className="text-[10px] opacity-80 font-medium">DPT (USIA ≥ 17 TH)</p>
                                <p className="text-2xl font-bold">{statistik.dptL + statistik.dptP}</p>
                                <div className="flex gap-2 mt-1 text-[10px] opacity-80"><span>L: {statistik.dptL}</span><span>P: {statistik.dptP}</span></div>
                            </CardContent></Card>
                            <Card className="bg-violet-500 text-white border-0"><CardContent className="p-3">
                                <p className="text-[10px] opacity-80 font-medium">PENDUDUK SEMENTARA</p>
                                <p className="text-2xl font-bold">{statistik.sementaraKK} KK</p>
                                <p className="text-lg font-semibold">{statistik.sementaraL + statistik.sementaraP} penduduk</p>
                                <div className="flex gap-2 mt-1 text-[10px] opacity-80"><span>L: {statistik.sementaraL}</span><span>P: {statistik.sementaraP}</span></div>
                            </CardContent></Card>
                        </div>

                        <Card>
                            <CardContent className="px-4 pb-3 pt-3">
                                <h3 className="text-sm font-semibold text-emerald-700 mb-2">Penduduk Wajib KTP (Baru Masuk 17 Tahun)</h3>
                                {statistik.wajibKTPList.length === 0 ? (
                                    <p className="text-xs text-muted-foreground text-center py-4">Tidak ada penduduk yang baru masuk usia 17 tahun</p>
                                ) : (
                                    <div className="overflow-x-auto">
                                        <table className="w-full text-[11px]">
                                            <thead><tr className="bg-rose-50 text-rose-700">
                                                <th className="text-left p-2">No</th><th className="text-left p-2">No. KK</th><th className="text-left p-2">NIK</th>
                                                <th className="text-left p-2">Nama</th><th className="text-left p-2">L/P</th><th className="text-left p-2">TTL</th>
                                                <th className="text-left p-2">Status Keluarga</th><th className="text-left p-2">KTP</th>
                                            </tr></thead>
                                            <tbody>
                                                {statistik.wajibKTPList.map((item, idx) => (
                                                    <tr key={item.dataWargaId} className={idx % 2 === 0 ? "bg-white" : "bg-gray-50"}>
                                                        <td className="p-2">{idx + 1}</td>
                                                        <td className="p-2 font-mono">{item.noKk}</td>
                                                        <td className="p-2 font-mono">{item.nik}</td>
                                                        <td className="p-2 font-medium">{item.namaLengkap}</td>
                                                        <td className="p-2">{item.jenisKelamin === "LAKI-LAKI" ? "L" : "P"}</td>
                                                        <td className="p-2">{item.tempatLahir}, {item.tanggalLahir}</td>
                                                        <td className="p-2">{item.statusKeluarga}</td>
                                                        <td className="p-2">{item.punyaKtp === "PUNYA" ? "Sudah" : "Belum"}</td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                )}
                            </CardContent>
                        </Card>

                        <Card>
                            <CardContent className="px-4 pb-3 pt-3">
                                <h3 className="text-sm font-semibold text-emerald-700 mb-2">Kejadian Bulan Ini</h3>
                                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                                    {(["LAHIR", "MATI", "PINDAH", "DATANG"] as const).map((type) => {
                                        const d = statistik.kejadianCounts[type];
                                        const color = type === "LAHIR" ? "text-green-600 bg-green-50" : type === "MATI" ? "text-red-600 bg-red-50" : type === "PINDAH" ? "text-orange-600 bg-orange-50" : "text-blue-600 bg-blue-50";
                                        return (
                                            <div key={type} className={`${color} rounded-lg p-2 text-center`}>
                                                <p className="text-[10px] font-semibold">{type}</p>
                                                <p className="text-lg font-bold">{d.l + d.p}</p>
                                                <div className="flex justify-center gap-2 text-[9px]"><span>L: {d.l}</span><span>P: {d.p}</span></div>
                                            </div>
                                        );
                                    })}
                                </div>
                            </CardContent>
                        </Card>

                        <Card>
                            <CardContent className="px-4 pb-3 pt-3">
                                <h3 className="text-sm font-semibold text-emerald-700 mb-2">Distribusi Usia Penduduk</h3>
                                <div className="grid grid-cols-2 gap-1 max-h-72 overflow-y-auto text-[11px]">
                                    {ageData.map((a) => (
                                        <div key={a.age} className="flex justify-between p-1 border-b border-gray-50">
                                            <span>Umur {a.age}</span><span className="font-medium">{a.l} / {a.p}</span>
                                        </div>
                                    ))}
                                    {ageData.length === 0 && <p className="text-muted-foreground col-span-2 text-center">Belum ada data.</p>}
                                </div>
                            </CardContent>
                        </Card>
                    </TabsContent>

                    <TabsContent value="penduduk">
                        <div className="rounded-xl border bg-card p-4">
                            <p className="text-sm text-muted-foreground mb-3">CRUD Penduduk: halaman daftar/tambah/edit yang sudah tersedia tetap berlaku.</p>
                            <div className="flex gap-2 flex-wrap">
                                <Button asChild><Link href="/data-warga/penduduk">Buka Daftar Penduduk</Link></Button>
                            </div>
                        </div>
                    </TabsContent>

                    <TabsContent value="sementara"><div className="rounded-xl border border-dashed p-10 text-center text-muted-foreground">Modul Penduduk Sementara - Segera</div></TabsContent>
                    <TabsContent value="kejadian"><div className="rounded-xl border border-dashed p-10 text-center text-muted-foreground">Modul Kejadian - Segera</div></TabsContent>
                    <TabsContent value="bantuan"><div className="rounded-xl border border-dashed p-10 text-center text-muted-foreground">Modul Bansos - Segera</div></TabsContent>
                    <TabsContent value="laporan"><div className="rounded-xl border border-dashed p-10 text-center text-muted-foreground">Modul Laporan - Segera</div></TabsContent>
                    <TabsContent value="dokumen"><div className="rounded-xl border border-dashed p-10 text-center text-muted-foreground">Modul Dokumen - Segera</div></TabsContent>
                </Tabs>
            </div>
        </div>
    );
}

async function prismaUser(userId: string) {
    const { prisma } = await import("@/lib/prisma");
    return prisma.user.findUnique({ where: { userId } });
}
