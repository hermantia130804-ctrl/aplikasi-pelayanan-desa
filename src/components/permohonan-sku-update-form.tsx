"use client";

import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
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
import { FileUploadField } from "@/components/ui/file-upload-field";
import { PATHS } from "@/constants/paths";
import { updatePermohonanSKUAction } from "@/lib/server/actions/permohonan-sku";
import { cn } from "@/lib/utils";
import {
  updatePermohonanSKUSchema,
  TUpdatePermohonanSKUSchema,
} from "@/lib/validators/permohonan-sku";
import { PermohonanSKU } from "@/generated/prisma";
import { zodResolver } from "@hookform/resolvers/zod";
import { format } from "date-fns";
import { id } from "date-fns/locale";
import { CalendarIcon, Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";

type PermohonanSKUWithUser = PermohonanSKU & {
  user: {
    userId: string;
    name: string;
    email: string;
    role: string;
  };
};

interface PermohonanSKUUpdateFormProps {
  permohonan: PermohonanSKUWithUser;
}

export function PermohonanSKUUpdateForm({
  permohonan,
}: PermohonanSKUUpdateFormProps) {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);

  const form = useForm<TUpdatePermohonanSKUSchema>({
    resolver: zodResolver(updatePermohonanSKUSchema),
    defaultValues: {
      nik: permohonan.nik,
      nama: permohonan.nama,
      tempatLahir: permohonan.tempatLahir,
      tanggalLahir: permohonan.tanggalLahir,
      jenisKelamin: permohonan.jenisKelamin,
      alamat: permohonan.alamat,
      jenisUsaha: permohonan.jenisUsaha,
      tahunBerdiriUsaha: permohonan.tahunBerdiriUsaha,
      lokasiUsaha: permohonan.lokasiUsaha,
      catatan: permohonan.catatan || "",
      dokumenKK: permohonan.dokumenKK || "",
      dokumenKTP: permohonan.dokumenKTP || "",
      dokumenSP: permohonan.dokumenSP || "",
      dokumenUsaha: permohonan.dokumenUsaha || "",
      expiresAt: permohonan.expiresAt,
    },
  });

  const onSubmit = async (values: TUpdatePermohonanSKUSchema) => {
    try {
      setIsLoading(true);
      const result = await updatePermohonanSKUAction(
        permohonan.permohonanSKUId,
        values
      );

      if (result.status === 200) {
        toast.success(result.message);
        router.push(PATHS.SKU_REQUEST);
      } else {
        toast.error(result.message);
      }
    } catch (error) {
      if (error instanceof Error) {
        toast.error(error.message);
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
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
                    <Input placeholder="Masukkan NIK (16 digit)" {...field} />
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
                    <Input placeholder="Masukkan nama lengkap" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="tempatLahir"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Tempat Lahir</FormLabel>
                  <FormControl>
                    <Input placeholder="Masukkan tempat lahir" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

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
              name="alamat"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Alamat</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Masukkan alamat lengkap"
                      className="resize-none"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          {/* Data Usaha */}
          <div className="space-y-4">
            <h3 className="text-lg font-medium">Data Usaha</h3>
            
            <FormField
              control={form.control}
              name="jenisUsaha"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Jenis Usaha</FormLabel>
                  <FormControl>
                    <Input placeholder="Masukkan jenis usaha" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="tahunBerdiriUsaha"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Tahun Berdiri Usaha</FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      placeholder="Masukkan tahun berdiri usaha"
                      {...field}
                      onChange={(e) => field.onChange(Number(e.target.value))}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="lokasiUsaha"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Lokasi Usaha</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Masukkan lokasi usaha lengkap"
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
              name="expiresAt"
              render={({ field }) => (
                <FormItem className="flex flex-col">
                  <FormLabel>Tanggal Kadaluarsa</FormLabel>
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
                            <span>Pilih tanggal kadaluarsa</span>
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

            <FormField
              control={form.control}
              name="catatan"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Catatan (Opsional)</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Masukkan catatan tambahan"
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

        {/* Dokumen Pendukung */}
        <div className="space-y-4">
          <h3 className="text-lg font-medium">Dokumen Pendukung</h3>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <FormField
              control={form.control}
              name="dokumenKK"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Dokumen Kartu Keluarga (Opsional)</FormLabel>
                  <FormControl>
                    <FileUploadField
                      value={field.value}
                      onChange={field.onChange}
                      accept="application/pdf"
                      placeholder="Upload dokumen KK (PDF)"
                      bucketName="kartu-keluarga"
                    />
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
                  <FormLabel>Dokumen KTP (Opsional)</FormLabel>
                  <FormControl>
                    <FileUploadField
                      value={field.value}
                      onChange={field.onChange}
                      accept="application/pdf"
                      placeholder="Upload dokumen KTP (PDF)"
                      bucketName="ktp"
                    />
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
                  <FormLabel>Dokumen Surat Pengantar (Opsional)</FormLabel>
                  <FormControl>
                    <FileUploadField
                      value={field.value}
                      onChange={field.onChange}
                      accept="application/pdf"
                      placeholder="Upload surat pengantar (PDF)"
                      bucketName="pengantar"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="dokumenUsaha"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Dokumen Usaha (Opsional)</FormLabel>
                  <FormControl>
                    <FileUploadField
                      value={field.value}
                      onChange={field.onChange}
                      accept="application/pdf"
                      placeholder="Upload dokumen usaha (PDF)"
                      bucketName="dokumen-usaha"
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
            Simpan Perubahan
          </Button>
        </div>
      </form>
    </Form>
  );
}
