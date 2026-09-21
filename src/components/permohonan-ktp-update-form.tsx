"use client";

import { Button } from "@/components/ui/button";
import {
    Form,
    FormControl,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { PATHS } from "@/constants/paths";
import { PermohonanKTP } from "@/generated/prisma";
import { updatePermohonanKTPAction } from "@/lib/server/actions/permohonan-ktp";
import { updatePermohonanKTPSchema } from "@/lib/validators/permohonan-ktp";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";
import { cn } from "@/lib/utils";
import { Calendar } from "@/components/ui/calendar";
import { FileUploadField } from "@/components/ui/file-upload-field";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Separator } from "@/components/ui/separator";
import { ArrowLeftIcon, CalendarIcon, CheckCircle2 } from "lucide-react";
import moment from "moment";

type PermohonanKTPUpdateFormProps = {
  permohonanKTP: PermohonanKTP;
};

export const PermohonanKTPUpdateForm = ({ permohonanKTP }: PermohonanKTPUpdateFormProps) => {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const form = useForm<z.infer<typeof updatePermohonanKTPSchema>>({
    resolver: zodResolver(updatePermohonanKTPSchema),
    defaultValues: {
      nama: permohonanKTP.nama || "",
      nik: permohonanKTP.nik || "",
      tempatLahir: permohonanKTP.tempatLahir || "",
      tanggalLahir: permohonanKTP.tanggalLahir ? moment(permohonanKTP.tanggalLahir).toDate() : moment().toDate(),
      jenisKelamin: permohonanKTP.jenisKelamin || "LAKI_LAKI",
      golonganDarah: (["A", "B", "AB", "O"].includes(String(permohonanKTP.golonganDarah)) ? String(permohonanKTP.golonganDarah) : "A") as "A" | "B" | "AB" | "O",
      statusPerkawinan: permohonanKTP.statusPerkawinan || "BELUM_KAWIN",
      agama: permohonanKTP.agama || "ISLAM",
      alamat: permohonanKTP.alamat || "",
      provinsi: permohonanKTP.provinsi || "",
      kabupaten: permohonanKTP.kabupaten || "",
      kecamatan: permohonanKTP.kecamatan || "",
      desa: permohonanKTP.desa || "",
      rt: permohonanKTP.rt || "",
      rw: permohonanKTP.rw || "",
      kodePos: permohonanKTP.kodePos || "",
      jenisPermohonanKTP: permohonanKTP.jenisPermohonanKTP || "BARU",
      dokumenKK: permohonanKTP.dokumenKK || "",
      dokumenPengantar: permohonanKTP.dokumenPengantar || "",
      catatan: permohonanKTP.catatan || "",
    },
  });

  const onSubmit = async (values: z.infer<typeof updatePermohonanKTPSchema>) => {
    try {
      setLoading(true);
      const response = await updatePermohonanKTPAction(permohonanKTP.permohonanKtpId, values);
      if (response.status === 200) {
        toast.success(response.message);
        router.push(`${PATHS.KTP_REQUEST}/${permohonanKTP.permohonanKtpId}`);
      } else {
        toast.error(response.message);
      }
    } catch (error) {
      if (error instanceof Error) {
        return toast.error("Terjadi kesalahan pada server.");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6 pb-24">
        <h2 className="text-base font-bold mb-1">I. Data Diri</h2>
        <Separator className="mb-4" />
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="nama"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Nama</FormLabel>
                <FormControl>
                  <Input placeholder="Masukkan nama lengkap" {...field} autoCapitalize="words" />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="nik"
            render={({ field }) => (
              <FormItem>
                <FormLabel>NIK</FormLabel>
                <FormControl>
                  <Input placeholder="Contoh: 3201234567890001" maxLength={16} inputMode="numeric" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>
        <div className="flex flex-col md:flex-row gap-4 w-full col-span-2">
          <div className="flex-1">
            <FormField
              control={form.control}
              name="tempatLahir"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Tempat Lahir</FormLabel>
                  <FormControl>
                    <Input placeholder="Contoh: Bandung" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
          <div className="flex-1">
            <FormField
              control={form.control}
              name="tanggalLahir"
              render={({ field }) => (
                <FormItem className="flex flex-col">
                  <FormLabel>Tanggal Lahir</FormLabel>
                  <Popover>
                    <PopoverTrigger asChild>
                      <FormControl>
                        <Button
                          variant={"outline"}
                          className={cn(
                            "w-full pl-3 text-left font-normal",
                            !field.value && "text-muted-foreground"
                          )}
                        >
                          {field.value ? (
                            moment(field.value).format("DD MMMM YYYY")
                          ) : (
                            <span>Pilih tanggal lahir</span>
                          )}
                          <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                        </Button>
                      </FormControl>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <Calendar
                        mode="single"
                        selected={field.value}
                        onSelect={field.onChange}
                        disabled={(date) =>
                          date > new Date() || date < new Date("1900-01-01")
                        }
                        captionLayout="dropdown"
                      />
                    </PopoverContent>
                  </Popover>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="jenisKelamin"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Jenis Kelamin</FormLabel>
                <Select
                  onValueChange={field.onChange}
                  defaultValue={field.value}
                >
                  <FormControl>
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Pilih jenis kelamin" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="LAKI_LAKI">Laki-laki</SelectItem>
                    <SelectItem value="PEREMPUAN">Perempuan</SelectItem>
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="golonganDarah"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Golongan Darah</FormLabel>
                <Select
                  onValueChange={field.onChange}
                  defaultValue={field.value}
                >
                  <FormControl>
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Pilih golongan darah" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="A">A</SelectItem>
                    <SelectItem value="B">B</SelectItem>
                    <SelectItem value="AB">AB</SelectItem>
                    <SelectItem value="O">O</SelectItem>
                    <SelectItem value="TIDAK_TAHU">Tidak Tahu</SelectItem>
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="statusPerkawinan"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Status Perkawinan</FormLabel>
                <Select
                  onValueChange={field.onChange}
                  defaultValue={field.value}
                >
                  <FormControl>
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Pilih status perkawinan" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="BELUM_KAWIN">Belum Kawin</SelectItem>
                    <SelectItem value="KAWIN">Kawin</SelectItem>
                    <SelectItem value="CERAI_HIDUP">Cerai Hidup</SelectItem>
                    <SelectItem value="CERAI_MATI">Cerai Mati</SelectItem>
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="agama"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Agama</FormLabel>
                <Select
                  onValueChange={field.onChange}
                  defaultValue={field.value}
                >
                  <FormControl>
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Pilih agama" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="ISLAM">Islam</SelectItem>
                    <SelectItem value="KRISTEN">Kristen</SelectItem>
                    <SelectItem value="KATOLIK">Katolik</SelectItem>
                    <SelectItem value="HINDU">Hindu</SelectItem>
                    <SelectItem value="BUDDHA">Buddha</SelectItem>
                    <SelectItem value="KONGHUCU">Konghucu</SelectItem>
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>
        <h2 className="text-base font-bold mt-8 mb-1">II. Alamat</h2>
        <Separator className="mb-4" />
        <FormField
          control={form.control}
          name="alamat"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Alamat</FormLabel>
              <FormControl>
                <Textarea placeholder="Masukkan alamat lengkap" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <div className="flex gap-2 w-full">
          <div className="flex-1">
            <FormField
              control={form.control}
              name="rt"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>RT</FormLabel>
                  <FormControl>
                    <Input placeholder="001" maxLength={3} inputMode="numeric" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
          <span className="flex items-center font-bold text-lg">/</span>
          <div className="flex-1">
            <FormField
              control={form.control}
              name="rw"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>RW</FormLabel>
                  <FormControl>
                    <Input placeholder="001" maxLength={3} inputMode="numeric" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="provinsi"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Provinsi</FormLabel>
                <FormControl>
                  <Input placeholder="Masukkan provinsi" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="kabupaten"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Kabupaten</FormLabel>
                <FormControl>
                  <Input placeholder="Masukkan kabupaten" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="kecamatan"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Kecamatan</FormLabel>
                <FormControl>
                  <Input placeholder="Masukkan kecamatan" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="desa"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Desa</FormLabel>
                <FormControl>
                  <Input placeholder="Masukkan desa" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="kodePos"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Kode Pos</FormLabel>
                <FormControl>
                  <Input placeholder="Contoh: 40211" maxLength={5} inputMode="numeric" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>
        <h2 className="text-base font-bold mt-8 mb-1">III. Jenis Permohonan & Dokumen</h2>
        <Separator className="mb-4" />
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="jenisPermohonanKTP"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Jenis Permohonan</FormLabel>
                <Select
                  onValueChange={field.onChange}
                  defaultValue={field.value}
                >
                  <FormControl>
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Pilih jenis permohonan" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="BARU">Baru</SelectItem>
                    <SelectItem value="PERUBAHAN">Perubahan</SelectItem>
                    <SelectItem value="PENGGANTIAN">Penggantian</SelectItem>
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="dokumenKK"
            render={({ field }) => (
              <FormItem className="col-span-2">
                <FormLabel>Dokumen KK (PDF)</FormLabel>
                <FormControl>
                  <div className="relative">
                    <FileUploadField
                      value={field.value || ""}
                      onChange={field.onChange}
                      accept=".pdf"
                      placeholder="Klik untuk memilih dokumen KK (PDF)"
                      disabled={loading}
                      bucketName="kartu-keluarga"
                    />
                    {field.value && (
                      <span className="absolute top-2 right-2 text-green-600 flex items-center gap-1 text-xs font-medium">
                        <CheckCircle2 className="w-4 h-4" />
                        Berhasil diunggah
                      </span>
                    )}
                  </div>
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="dokumenPengantar"
            render={({ field }) => (
              <FormItem className="col-span-2">
                <FormLabel>Dokumen Pengantar (PDF)</FormLabel>
                <FormControl>
                  <div className="relative">
                    <FileUploadField
                      value={field.value || ""}
                      onChange={field.onChange}
                      accept=".pdf"
                      placeholder="Klik untuk memilih dokumen pengantar (PDF)"
                      disabled={loading}
                      bucketName="pengantar"
                    />
                    {field.value && (
                      <span className="absolute top-2 right-2 text-green-600 flex items-center gap-1 text-xs font-medium">
                        <CheckCircle2 className="w-4 h-4" />
                        Berhasil diunggah
                      </span>
                    )}
                  </div>
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>
        <FormField
          control={form.control}
          name="catatan"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Catatan</FormLabel>
              <FormControl>
                <Textarea placeholder="Masukkan catatan (opsional)" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <div className="flex justify-end gap-2 fixed md:static bottom-0 left-0 w-full bg-white md:bg-transparent z-20 p-4 md:p-0 border-t md:border-0">
          <Button type="button" variant="outline" className="w-full md:w-auto" onClick={() => router.back()}>
            <ArrowLeftIcon className="w-4 h-4" />
            Kembali
          </Button>
          <Button type="submit" disabled={loading} className="w-full md:w-auto">
            {loading ? "Menyimpan..." : "Simpan"}
          </Button>
        </div>
      </form>
    </Form>
  );
};
