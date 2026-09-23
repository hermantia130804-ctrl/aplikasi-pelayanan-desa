"use client";

import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { FileUploadField } from "@/components/ui/file-upload-field";
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
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { PATHS } from "@/constants/paths";
import { Agama, JenisKelamin, WargaNegara } from "@/generated/prisma";
import { cn } from "@/lib/utils";
import { createPermohonanSKDSchema } from "@/lib/validators/permohonan-skd";
import { createPermohonanSKDAction } from "@/lib/server/actions/permohonan-skd";
import { zodResolver } from "@hookform/resolvers/zod";
import { format } from "date-fns";
import { id } from "date-fns/locale";
import { CalendarIcon, CheckCircle2, Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";

type CreatePermohonanSKDFormData = z.infer<typeof createPermohonanSKDSchema>;

export function PermohonanSKDCreateForm() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);

  const form = useForm<CreatePermohonanSKDFormData>({
    resolver: zodResolver(createPermohonanSKDSchema),
    defaultValues: {
      nik: "",
      nama: "",
      alamatKTP: "",
      alamatDomisili: "",
      agama: Agama.ISLAM,
      tempatLahir: "",
      jenisKelamin: JenisKelamin.LAKI_LAKI,
      wargaNegara: WargaNegara.WNI,
      catatan: "",
      dokumenKK: "",
      dokumenKTP: "",
      dokumenSP: "",
    },
  });

  const onSubmit = async (data: CreatePermohonanSKDFormData) => {
    try {
      setIsLoading(true);
      const formData = new FormData();

      Object.entries(data).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          if (value instanceof Date) {
            formData.append(key, value.toISOString());
          } else {
            formData.append(key, value.toString());
          }
        }
      });

      const result = await createPermohonanSKDAction(formData);
      
      if (result.success) {
        toast.success(result.message);
        router.push("/permohonan-saya");
      }
    } catch (error) {
      toast.error("Gagal membuat permohonan SKD");
      console.error("Create error:", error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
        <div className="grid gap-8">
          {/* Data Pribadi */}
          <div className="space-y-4">
            <h3 className="text-lg font-medium">Data Pribadi</h3>

            <FormField
              control={form.control}
              name="nik"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>NIK</FormLabel>
                  <FormControl>
                    <Input placeholder="Masukkan NIK 16 digit..." {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="nama"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Nama Lengkap</FormLabel>
                  <FormControl>
                    <Input placeholder="Masukkan nama lengkap..." {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="alamatKTP"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Alamat KTP</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Masukkan alamat sesuai KTP..."
                      className="resize-none"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="alamatDomisili"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Alamat Domisili</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Masukkan alamat domisili saat ini..."
                      className="resize-none"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid gap-4 md:grid-cols-2">
              <FormField
                control={form.control}
                name="tempatLahir"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Tempat Lahir</FormLabel>
                    <FormControl>
                      <Input placeholder="Masukkan tempat lahir..." {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="tanggalLahir"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Tanggal Lahir</FormLabel>
                    <Popover>
                      <PopoverTrigger asChild>
                        <FormControl>
                          <Button
                            variant="outline"
                            className={cn(
                              "w-full pl-3 text-left font-normal",
                              !field.value && "text-muted-foreground"
                            )}
                          >
                            {field.value ? (
                              format(field.value, "dd MMMM yyyy", { locale: id })
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
                          initialFocus
                          locale={id}
                        />
                      </PopoverContent>
                    </Popover>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="grid gap-4 md:grid-cols-3">
              <FormField
                control={form.control}
                name="jenisKelamin"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Jenis Kelamin</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Pilih jenis kelamin" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value={JenisKelamin.LAKI_LAKI}>Laki-laki</SelectItem>
                        <SelectItem value={JenisKelamin.PEREMPUAN}>Perempuan</SelectItem>
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
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Pilih agama" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value={Agama.ISLAM}>Islam</SelectItem>
                        <SelectItem value={Agama.PROTESTAN}>Protestan</SelectItem>
                        <SelectItem value={Agama.KATOLIK}>Katolik</SelectItem>
                        <SelectItem value={Agama.HINDU}>Hindu</SelectItem>
                        <SelectItem value={Agama.BUDDHA}>Buddha</SelectItem>
                        <SelectItem value={Agama.KONGHUCU}>Konghucu</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="wargaNegara"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Warga Negara</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Pilih warga negara" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value={WargaNegara.WNI}>WNI</SelectItem>
                        <SelectItem value={WargaNegara.WNA}>WNA</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="expiresAt"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Tanggal Kedaluwarsa</FormLabel>
                  <Popover>
                    <PopoverTrigger asChild>
                      <FormControl>
                        <Button
                          variant="outline"
                          className={cn(
                            "w-full pl-3 text-left font-normal",
                            !field.value && "text-muted-foreground"
                          )}
                        >
                          {field.value ? (
                            format(field.value, "dd MMMM yyyy", { locale: id })
                          ) : (
                            <span>Pilih tanggal kedaluwarsa</span>
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
                        disabled={(date) => date < new Date()}
                        initialFocus
                        locale={id}
                      />
                    </PopoverContent>
                  </Popover>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          {/* Dokumen Pendukung */}
          <div className="space-y-4">
            <h3 className="text-lg font-medium">Dokumen Pendukung</h3>

            <FormField
              control={form.control}
              name="dokumenKK"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Dokumen KK (PDF)</FormLabel>
                  <FormControl>
                    <div className="relative">
                      <FileUploadField
                        value={field.value || ""}
                        onChange={field.onChange}
                        accept=".pdf"
                        placeholder="Klik untuk memilih dokumen KK (PDF)"
                        bucketName="docs"
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

            <FormField
              control={form.control}
              name="dokumenKTP"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Dokumen KTP (PDF)</FormLabel>
                  <FormControl>
                    <div className="relative">
                      <FileUploadField
                        value={field.value || ""}
                        onChange={field.onChange}
                        accept=".pdf"
                        placeholder="Klik untuk memilih dokumen KTP (PDF)"
                        bucketName="docs"
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

            <FormField
              control={form.control}
              name="dokumenSP"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Dokumen Surat Pengantar (PDF)</FormLabel>
                  <FormControl>
                    <div className="relative">
                      <FileUploadField
                        value={field.value || ""}
                        onChange={field.onChange}
                        accept=".pdf"
                        placeholder="Klik untuk memilih dokumen surat pengantar (PDF)"
                        bucketName="docs"
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

          {/* Catatan */}
          <div className="space-y-4">
            <h3 className="text-lg font-medium">Catatan</h3>

            <FormField
              control={form.control}
              name="catatan"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Catatan (Opsional)</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Masukkan catatan tambahan..."
                      className="resize-none"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
        </div>

        <div className="flex justify-end space-x-4">
          <Button
            type="button"
            variant="outline"
            onClick={() => router.back()}
            disabled={isLoading}
          >
            Batal
          </Button>
          <Button type="submit" disabled={isLoading}>
            {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Simpan Permohonan
          </Button>
        </div>
      </form>
    </Form>
  );
}
