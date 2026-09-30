"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { createPerbaikanDesilAction } from "@/lib/server/actions/perbaikan-desil";
import { PILIHAN_DESIL } from "@/constants/desil";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";
import { ArrowLeftIcon, Loader2, Trash2 } from "lucide-react";
import Link from "next/link";
import Image from "next/image";

type FormState = Record<string, string>;

const initial: FormState = {
  namaKk: "", nikKk: "", noKk: "", jumlahAnggota: "1",
  alamat: "", namaJalan: "", noRumah: "",
  jenisBangunan: "Rumah Tunggal", tinggalBersamaKeluargaLain: "Tidak", jumlahPenghuni: "1",
  statusKepemilikan: "Milik Sendiri", buktiTanah: "SHM",
  hargaSewaBulan: "0", luasLantai: "0",
  jenisLantai: "Ubin/tegel/teraso", kondisiLantai: "Baik",
  jenisDinding: "Tembok", kondisiDinding: "Baik",
  jenisAtap: "Genteng", kondisiAtap: "Baik",
  fasilitasBAB: PILIHAN_DESIL.fasilitasBAB[0],
  jenisKloset: "Leher angsa", buanganTinja: PILIHAN_DESIL.buanganTinja[0],
  sumberAir: PILIHAN_DESIL.sumberAir[0],
  sumberPenerangan: PILIHAN_DESIL.sumberPenerangan[0],
  jumlahMeteran: "1", dayaListrik: "900 watt", idPelangganPln: "",
  pengeluaranListrik: "0", pengeluaranInternet: "0",
  pengeluaranMakananMingguan: "0", pengeluaranBukanMakananBulanan: "0",
  pengeluaranBukanMakananTahunan: "0",
  asetGas3kg: "0", asetGas55kg: "0", asetKulkas: "0", asetAc: "0",
  asetEmas: "0", asetKomputer: "0", asetMotor: "0", asetMobil: "0",
  asetRumahLain: "Tidak", asetLahanLain: "0",
};

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="rounded-2xl border bg-card p-5 shadow-sm">
      <h2 className="mb-4 text-lg font-bold">{title}</h2>
      <div className="grid gap-4 sm:grid-cols-2">{children}</div>
    </div>
  );
}

function Field({ label, wajib = true, children }: { label: string; wajib?: boolean; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-1.5">
      <Label className="text-sm">
        {label} {wajib && <span className="text-red-500">*</span>}
      </Label>
      {children}
    </div>
  );
}

function SelectField({ value, onChange, options, label, wajib }: { value: string; onChange: (v: string) => void; options: readonly string[]; label: string; wajib?: boolean }) {
  return (
    <Field label={label} wajib={wajib}>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="h-10 rounded-md border bg-background px-3 text-sm"
      >
        {options.map((o) => (
          <option key={o} value={o}>{o}</option>
        ))}
      </select>
    </Field>
  );
}

export function PerbaikanDesilForm() {
    const router = useRouter();
    const [loading, setLoading] = useState(false);
    const [form, setForm] = useState<FormState>(initial);
    const [files, setFiles] = useState<File[]>([]);
    const [previews, setPreviews] = useState<string[]>([]);

    const set = (k: string) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) =>
        setForm((f) => ({ ...f, [k]: e.target.value }));

    const onPickFiles = (e: React.ChangeEvent<HTMLInputElement>) => {
        const picked = Array.from(e.target.files ?? []);
        const jpg = picked.filter((f) => f.type === "image/jpeg");
        if (jpg.length !== picked.length) toast.error("Ada file yang bukan JPG dan dilewati.");
        const gabung = [...files, ...jpg].slice(0, 5);
        if (gabung.some((f) => f.size > 1024 * 1024)) {
            toast.error("Ada foto di atas 1 MB. Perkecil dulu.");
            return;
        }
        if (gabung.length > 5) toast.error("Maksimal 5 foto.");
        setFiles(gabung);
        setPreviews(gabung.map((f) => URL.createObjectURL(f)));
        e.target.value = "";
    };

    const hapusFoto = (idx: number) => {
        setFiles(files.filter((_, i) => i !== idx));
        setPreviews(previews.filter((_, i) => i !== idx));
    };

    const onSubmit = async () => {
        try {
            setLoading(true);
            if (files.length < 1) { toast.error("Minimal 1 foto rumah wajib diunggah"); return; }

            const fotoUrls: string[] = [];
            for (const f of files) {
                const fd = new FormData();
                fd.append("file", f);
                const { uploadFotoDesilAction } = await import("@/lib/server/actions/upload-foto-desil");
                const res = await uploadFotoDesilAction(fd);
                if (res.url) fotoUrls.push(res.url);
                else { toast.error(res.error || "Gagal mengunggah foto"); return; }
            }

            const payload = { ...form, fotoUrls };
            const { createPerbaikanDesilAction } = await import("@/lib/server/actions/perbaikan-desil");
            const res = await createPerbaikanDesilAction(payload);

            if (res.status === 200) {
                toast.success(res.message);
                router.push("/perbaikan-desil");
                router.refresh();
            } else {
                toast.error(res.message || "Gagal menyimpan");
            }
        } catch (e) {
            toast.error(e instanceof Error ? e.message : "Terjadi kesalahan");
        } finally {
            setLoading(false);
        }
    };

    const num = (k: string, label: string, wajib = true) => (
        <Field label={label} wajib={wajib}>
            <Input type="number" min={0} value={form[k]} onChange={set(k)} />
        </Field>
    );
    const txt = (k: string, label: string, placeholder = "") => (
        <Field label={label}>
            <Input value={form[k]} onChange={set(k)} placeholder={placeholder} />
        </Field>
    );

    return (
        <div className="flex flex-col gap-5">
            <Section title="1. Identitas Keluarga">
                {txt("namaKk", "Nama Kepala Keluarga")}
                {txt("nikKk", "NIK Kepala Keluarga", "16 digit")}
                {txt("noKk", "Nomor Kartu Keluarga", "16 digit")}
                {num("jumlahAnggota", "Jumlah Anggota")}
                <div className="sm:col-span-2">{txt("alamat", "Alamat Lengkap Rumah/Tempat Tinggal")}</div>
                {txt("namaJalan", "Nama Jalan")}
                {txt("noRumah", "Nomor Rumah")}
            </Section>

            <div className="rounded-2xl border border-dashed p-5">
                <Label className="text-sm font-semibold">
                    Upload Foto Rumah (GPS Map Camera) <span className="text-red-500">*</span>
                </Label>
                <p className="mt-1 text-xs text-muted-foreground">
                    Foto tampak depan, samping, ruang tamu, dan kamar mandi (4-5 foto). Gunakan aplikasi GPS Map Camera agar koordinat ikut. JPG, maks 1 MB per foto, maksimal 5 foto.
                </p>
                <Input type="file" accept="image/jpeg" multiple onChange={onPickFiles} className="mt-3" />
                {previews.length > 0 && (
                    <div className="mt-3 grid grid-cols-3 gap-3 sm:grid-cols-5">
                        {previews.map((p, i) => (
                            <div key={i} className="relative">
                                <Image src={p} alt={"Foto " + (i + 1)} width={120} height={90} className="h-20 w-full rounded-lg border object-cover" />
                                <button type="button" onClick={() => hapusFoto(i)} className="absolute -right-2 -top-2 rounded-full bg-red-500 p-1 text-white">
                                    <Trash2 className="size-3" />
                                </button>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            <Section title="2. Keterangan Sosial Ekonomi Keluarga">
                <SelectField label="Jenis bangunan tempat tinggal" value={form.jenisBangunan} onChange={(v) => setForm((f) => ({ ...f, jenisBangunan: v }))} options={PILIHAN_DESIL.jenisBangunan} />
                <SelectField label="Selain keluarga Anda, ada keluarga lain tinggal di rumah ini?" value={form.tinggalBersamaKeluargaLain} onChange={(v) => setForm((f) => ({ ...f, tinggalBersamaKeluargaLain: v }))} options={["Ya", "Tidak"]} />
                {num("jumlahPenghuni", "Berapa orang tinggal dalam 1 rumah")}
                <SelectField label="Status kepemilikan bangunan" value={form.statusKepemilikan} onChange={(v) => setForm((f) => ({ ...f, statusKepemilikan: v }))} options={PILIHAN_DESIL.statusKepemilikan} />
                <SelectField label="Bukti kepemilikan tanah" value={form.buktiTanah} onChange={(v) => setForm((f) => ({ ...f, buktiTanah: v }))} options={PILIHAN_DESIL.buktiTanah} />
                {num("hargaSewaBulan", "Perkiraan harga sewa selama sebulan (isi 0 jika milik sendiri)")}
                {num("luasLantai", "Luas lantai bangunan (m²)")}
                <SelectField label="Jenis lantai terluas" value={form.jenisLantai} onChange={(v) => setForm((f) => ({ ...f, jenisLantai: v }))} options={PILIHAN_DESIL.jenisLantai} />
                <SelectField label="Kondisi lantai" value={form.kondisiLantai} onChange={(v) => setForm((f) => ({ ...f, kondisiLantai: v }))} options={PILIHAN_DESIL.kondisi} />
                <SelectField label="Jenis dinding terluas" value={form.jenisDinding} onChange={(v) => setForm((f) => ({ ...f, jenisDinding: v }))} options={PILIHAN_DESIL.jenisDinding} />
                <SelectField label="Kondisi dinding" value={form.kondisiDinding} onChange={(v) => setForm((f) => ({ ...f, kondisiDinding: v }))} options={PILIHAN_DESIL.kondisi} />
                <SelectField label="Jenis atap terluas" value={form.jenisAtap} onChange={(v) => setForm((f) => ({ ...f, jenisAtap: v }))} options={PILIHAN_DESIL.jenisAtap} />
                <SelectField label="Kondisi atap" value={form.kondisiAtap} onChange={(v) => setForm((f) => ({ ...f, kondisiAtap: v }))} options={PILIHAN_DESIL.kondisi} />
                <div className="sm:col-span-2">
                    <SelectField label="Fasilitas tempat BAB dan siapa penggunanya" value={form.fasilitasBAB} onChange={(v) => setForm((f) => ({ ...f, fasilitasBAB: v }))} options={PILIHAN_DESIL.fasilitasBAB} />
                </div>
                <SelectField label="Jenis kloset yang digunakan" value={form.jenisKloset} onChange={(v) => setForm((f) => ({ ...f, jenisKloset: v }))} options={PILIHAN_DESIL.jenisKloset} />
                <SelectField label="Tempat pembuangan akhir tinja" value={form.buanganTinja} onChange={(v) => setForm((f) => ({ ...f, buanganTinja: v }))} options={PILIHAN_DESIL.buanganTinja} wajib={false} />
                <SelectField label="Sumber air minum utama" value={form.sumberAir} onChange={(v) => setForm((f) => ({ ...f, sumberAir: v }))} options={PILIHAN_DESIL.sumberAir} />
                <SelectField label="Sumber penerangan utama" value={form.sumberPenerangan} onChange={(v) => setForm((f) => ({ ...f, sumberPenerangan: v }))} options={PILIHAN_DESIL.sumberPenerangan} />
                {num("jumlahMeteran", "Jumlah meteran listrik terpasang")}
                <SelectField label="Daya listrik meteran ke-1" value={form.dayaListrik} onChange={(v) => setForm((f) => ({ ...f, dayaListrik: v }))} options={PILIHAN_DESIL.dayaListrik} />
                {txt("idPelangganPln", "Nomor ID Pelanggan PLN / No. Meteran")}
                {num("pengeluaranListrik", "Rata-rata pengeluaran listrik / bulan (Rp)")}
                {num("pengeluaranInternet", "Rata-rata pengeluaran internet / bulan (Rp)")}
                {num("pengeluaranMakananMingguan", "Rata-rata pengeluaran makanan keluarga / minggu (Rp)")}
                {num("pengeluaranBukanMakananBulanan", "Pengeluaran bukan makanan rutin / bulan (Rp)")}
                {num("pengeluaranBukanMakananTahunan", "Pengeluaran bukan makanan rutin / tahun (Rp)", false)}
            </Section>

            <Section title="3. Kepemilikan Aset (isi 0 jika tidak ada)">
                {num("asetGas3kg", "Tabung Gas 3 KG")}
                {num("asetGas55kg", "Tabung Gas 5,5 KG atau lebih")}
                {num("asetKulkas", "Lemari Es/Kulkas")}
                {num("asetAc", "AC (Air Conditioner)")}
                {num("asetEmas", "Emas/Perhiasan")}
                {num("asetKomputer", "Komputer/Laptop/Tablet")}
                {num("asetMotor", "Sepeda Motor")}
                {num("asetMobil", "Mobil")}
                <SelectField label="Rumah/Bangunan lain (selain yang ditempati)" value={form.asetRumahLain} onChange={(v) => setForm((f) => ({ ...f, asetRumahLain: v }))} options={["Ya", "Tidak"]} />
                {num("asetLahanLain", "Lahan Lainnya")}
            </Section>

            <div className="flex gap-2">
                <Button type="button" variant="outline" asChild>
                    <Link href="/perbaikan-desil"><ArrowLeftIcon className="w-4 h-4" /> Kembali</Link>
                </Button>
                <Button type="button" onClick={onSubmit} disabled={loading} className="flex-1 sm:flex-none">
                    {loading ? (
                        <><Loader2 className="mr-2 size-4 animate-spin" /> Mengirim...</>
                    ) : "Kirim Pengajuan"}
                </Button>
            </div>
        </div>
    );
}
