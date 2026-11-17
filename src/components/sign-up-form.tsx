"use client";

import { GalleryVerticalEnd, Camera } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { signUpAction } from "@/lib/server/actions/auth";
import { cn } from "@/lib/utils";
import { useState } from "react";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { TSignUpSchema, signUpSchema } from "@/lib/validators/auth";
import { zodResolver } from "@hookform/resolvers/zod";
import Link from "next/link";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { PasswordInput } from "@/components/password-input";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "./ui/form";
import { PATHS } from "@/constants/paths";
import { useRouter } from "next/navigation";
import { JABATAN_PETUGAS } from "@/constants/jabatan";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./ui/select";
import { SelfieCamera } from "@/components/selfie-camera";

type DaftarSebagai = "USER" | "PETUGAS" | "RT";

export const SignUpForm = ({
  className,
  ...props
}: React.ComponentProps<"div">) => {
  const router = useRouter();
  const [daftarSebagai, setDaftarSebagai] = useState<DaftarSebagai>("USER");
  const [showCamera, setShowCamera] = useState(false);
  const [stashed, setStashed] = useState<TSignUpSchema | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const form = useForm<TSignUpSchema>({
    resolver: zodResolver(signUpSchema),
    defaultValues: {
      email: "",
      password: "",
      address: "",
      phone: "",
      name: "",
      nik: "",
      jabatan: "",
      noRt: "",
      noRw: "",
      namaKetua: "",
      alamatRt: "",
      foto: "",
    },
  });

  // Kirim pendaftaran ke server. role tetap "USER" (server memaksa #2);
  // data ekstra (jabatan/noRt/noRw/namaKetua/alamatRt/foto) disimpan agar
  // admin bisa mengangkat menjadi PETUGAS/RT via Kelola Pengguna.
  const submitSignUp = async (data: TSignUpSchema, fotoUrl?: string) => {
    setSubmitting(true);
    try {
      const response = await signUpAction({
        email: data.email,
        nik: data.nik,
        name: data.name,
        password: data.password,
        address: data.address,
        phone: data.phone,
        role: "USER",
        jabatan: daftarSebagai === "PETUGAS" ? data.jabatan : undefined,
        noRt: daftarSebagai === "RT" ? data.noRt : undefined,
        noRw: daftarSebagai === "RT" ? data.noRw : undefined,
        namaKetua: daftarSebagai === "RT" ? data.namaKetua : undefined,
        alamatRt: daftarSebagai === "RT" ? data.alamatRt : undefined,
        foto: fotoUrl,
      } as Parameters<typeof signUpAction>[0]);
      if (response.status === 200) {
        form.reset();
        toast.success(response.message);
        router.push(PATHS.SIGN_IN);
      } else {
        toast.error(response.message);
      }
    } catch (error) {
      if (error instanceof Error) {
        toast.error("Terjadi kesalahan pada server.");
      }
    } finally {
      setSubmitting(false);
    }
  };

  const onSubmit = form.handleSubmit(async (data) => {
    // Masyarakat: langsung kirim email verifikasi (tanpa kamera).
    if (daftarSebagai === "USER") {
      await submitSignUp(data);
      return;
    }
    // Petugas / RT: validasi field ekstra sebelum buka kamera.
    if (daftarSebagai === "PETUGAS" && !data.jabatan) {
      toast.error("Pilih jabatan petugas terlebih dahulu.");
      return;
    }
    if (daftarSebagai === "RT" && (!data.noRt || !data.noRw)) {
      toast.error("Nomor RT dan RW wajib diisi.");
      return;
    }
    // Buka kamera selfie. Setelah foto terambil, lanjut submitSignUp.
    setStashed(data);
    setShowCamera(true);
  });

  const onFotoTerambil = async (url: string) => {
    setShowCamera(false);
    if (!stashed) return;
    await submitSignUp(stashed, url);
    setStashed(null);
  };

  return (
    <div className={cn("flex flex-col gap-6", className)} {...props}>
      <Form {...form}>
        <form onSubmit={onSubmit}>
          <div className="flex flex-col gap-2">
            <FormLabel>Daftar Sebagai</FormLabel>
            <RadioGroup
              defaultValue="USER"
              value={daftarSebagai}
              onValueChange={(v) => setDaftarSebagai(v as DaftarSebagai)}
              className="flex flex-wrap gap-4"
            >
              <div className="flex items-center gap-2">
                <RadioGroupItem value="USER" id="role-user" />
                <Label htmlFor="role-user">Masyarakat</Label>
              </div>
              <div className="flex items-center gap-2">
                <RadioGroupItem value="PETUGAS" id="role-petugas" />
                <Label htmlFor="role-petugas">Petugas</Label>
              </div>
              <div className="flex items-center gap-2">
                <RadioGroupItem value="RT" id="role-rt" />
                <Label htmlFor="role-rt">Ketua RT</Label>
              </div>
            </RadioGroup>
            {daftarSebagai !== "USER" && (
              <p className="text-xs text-muted-foreground">
                Akun aktif sebagai Masyarakat setelah verifikasi email. Admin akan mengangkat menjadi {daftarSebagai === "PETUGAS" ? "Petugas" : "Ketua RT"}.
              </p>
            )}
          </div>
          <div className="flex flex-col gap-6">
            <div className="flex flex-col items-center gap-2">
              <Link href={PATHS.HOME} className="flex flex-col items-center gap-2 font-medium">
                <div className="flex size-8 items-center justify-center rounded-md">
                  <GalleryVerticalEnd className="size-6" />
                </div>
                <span className="sr-only">Desa Sukamaju</span>
              </Link>
              <h1 className="text-xl font-bold">Daftar Akun Baru</h1>
              <div className="text-center text-sm">
                Sudah Punya Akun?{" "}
                <Link href={PATHS.SIGN_IN} className="underline underline-offset-4">Masuk</Link>
              </div>
            </div>
            <div className="flex flex-col gap-6">
              <FormField control={form.control} name="name" render={({ field }) => (
                <FormItem><FormLabel>Nama</FormLabel><FormControl><Input placeholder="Nama Lengkap" {...field} /></FormControl><FormMessage /></FormItem>
              )} />
              <FormField control={form.control} name="nik" render={({ field }) => (
                <FormItem><FormLabel>NIK</FormLabel><FormControl><Input placeholder="3207040101010001" {...field} /></FormControl><FormMessage /></FormItem>
              )} />
              <FormField control={form.control} name="email" render={({ field }) => (
                <FormItem><FormLabel>Email</FormLabel><FormControl><Input placeholder="contoh@email.com" {...field} /></FormControl><FormMessage /></FormItem>
              )} />
              <FormField control={form.control} name="password" render={({ field }) => (
                <FormItem><FormLabel>Password</FormLabel><FormControl><PasswordInput placeholder="Kata Sandi" {...field} /></FormControl><FormMessage /></FormItem>
              )} />
              <FormField control={form.control} name="address" render={({ field }) => (
                <FormItem><FormLabel>Alamat</FormLabel><FormControl><Input placeholder="Nomor Rumah, RT/RW" {...field} /></FormControl><FormMessage /></FormItem>
              )} />
              <FormField control={form.control} name="phone" render={({ field }) => (
                <FormItem>
                  <FormLabel>{daftarSebagai === "PETUGAS" ? "No. WhatsApp" : "No. Telepon"}</FormLabel>
                  <FormControl><Input placeholder="08XX-XXXX-XXXX" {...field} /></FormControl><FormMessage />
                </FormItem>
              )} />

              {/* Field khusus PETUGAS: jabatan */}
              {daftarSebagai === "PETUGAS" && (
                <FormField control={form.control} name="jabatan" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Jabatan Petugas</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value ?? undefined}>
                      <FormControl><SelectTrigger className="w-full"><SelectValue placeholder="Pilih Jabatan" /></SelectTrigger></FormControl>
                      <SelectContent>
                        {JABATAN_PETUGAS.map((j) => (<SelectItem key={j} value={j}>{j}</SelectItem>))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )} />
              )}

              {/* Field khusus RT: wilayah */}
              {daftarSebagai === "RT" && (
                <>
                  <div className="grid grid-cols-2 gap-3">
                    <FormField control={form.control} name="noRt" render={({ field }) => (
                      <FormItem><FormLabel>Nomor RT *</FormLabel><FormControl><Input placeholder="001" {...field} /></FormControl><FormMessage /></FormItem>
                    )} />
                    <FormField control={form.control} name="noRw" render={({ field }) => (
                      <FormItem><FormLabel>Nomor RW *</FormLabel><FormControl><Input placeholder="02" {...field} /></FormControl><FormMessage /></FormItem>
                    )} />
                  </div>
                  <FormField control={form.control} name="namaKetua" render={({ field }) => (
                    <FormItem><FormLabel>Nama Ketua RT</FormLabel><FormControl><Input placeholder="Nama lengkap ketua RT" {...field} /></FormControl><FormMessage /></FormItem>
                  )} />
                  <FormField control={form.control} name="alamatRt" render={({ field }) => (
                    <FormItem><FormLabel>Alamat Kantor RT</FormLabel><FormControl><Input placeholder="Alamat pos RT" {...field} /></FormControl><FormMessage /></FormItem>
                  )} />
                </>
              )}

              <Button type="submit" className="w-full" disabled={submitting}>
                {submitting ? "Memproses…" : (<><Camera className="mr-2 size-4" /> {daftarSebagai === "USER" ? "Daftar" : "Daftar (Ambil Selfie)"}</>)}
              </Button>
              {daftarSebagai !== "USER" && (
                <p className="text-center text-xs text-muted-foreground">
                  Setelah tekan Daftar, kamera terbuka untuk selfie. Hasil selfie menjadi foto profil.
                </p>
              )}
            </div>
          </div>
        </form>
      </Form>
      {showCamera && (
        <SelfieCamera onCaptured={onFotoTerambil} onCancel={() => { setShowCamera(false); setStashed(null); }} />
      )}
    </div>
  );
};
