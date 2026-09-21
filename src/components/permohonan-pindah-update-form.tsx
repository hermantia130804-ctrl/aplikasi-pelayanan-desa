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
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PATHS } from "@/constants/paths";
import { updatePermohonanPindahAction } from "@/lib/server/actions/permohonan-pindah";
import { cn } from "@/lib/utils";
import {
  updatePermohonanPindahSchema,
  TUpdatePermohonanPindahSchema,
} from "@/lib/validators/permohonan-pindah";
import { PermohonanPindah } from "@/generated/prisma";
import { zodResolver } from "@hookform/resolvers/zod";
import { format } from "date-fns";
import { id } from "date-fns/locale";
import { CalendarIcon, CheckCircle2, Loader2, Plus, Trash2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useForm, useFieldArray } from "react-hook-form";
import { toast } from "sonner";

type PermohonanPindahWithAnggota = PermohonanPindah & {
  permohonanPindahAnggota: Array<{
    permohonanPindahAnggotaId: string;
    nik: string;
    nama: string;
    shdk: string;
  }>;
};

interface PermohonanPindahUpdateFormProps {
  permohonan: PermohonanPindahWithAnggota;
}

export function PermohonanPindahUpdateForm({
  permohonan,
}: PermohonanPindahUpdateFormProps) {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);

  const form = useForm<TUpdatePermohonanPindahSchema>({
    resolver: zodResolver(updatePermohonanPindahSchema),
    defaultValues: {
      jenisPermohonanPindah: permohonan.jenisPermohonanPindah,
      nik: permohonan.nik,
      nama: permohonan.nama,
      alamatAsal: permohonan.alamatAsal,
      rtAsal: permohonan.rtAsal,
      rwAsal: permohonan.rwAsal,
      desaAsal: permohonan.desaAsal,
      kecamatanAsal: permohonan.kecamatanAsal,
      kabupatenAsal: permohonan.kabupatenAsal,
      provinsiAsal: permohonan.provinsiAsal,
      klarifikasiKepindahan: permohonan.klarifikasiKepindahan,
      jenisKepindahan: permohonan.jenisKepindahan,
      alasanPindah: permohonan.alasanPindah,
      anggotaKeluargaYangPindah: permohonan.anggotaKeluargaYangPindah,
      alamatTujuan: permohonan.alamatTujuan,
      rtTujuan: permohonan.rtTujuan,
      rwTujuan: permohonan.rwTujuan,
      desaTujuan: permohonan.desaTujuan,
      kecamatanTujuan: permohonan.kecamatanTujuan,
      kabupatenTujuan: permohonan.kabupatenTujuan,
      provinsiTujuan: permohonan.provinsiTujuan,
      catatan: permohonan.catatan || "",
      dokumenKK: permohonan.dokumenKK || "",
      dokumenKTP: permohonan.dokumenKTP || "",
      dokumenSP: permohonan.dokumenSP || "",
      anggotaKeluarga: permohonan.permohonanPindahAnggota.map((anggota) => ({
        nik: anggota.nik,
        nama: anggota.nama,
        shdk: anggota.shdk,
      })),
    },
  });

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: "anggotaKeluarga",
  });

  const addAnggotaKeluarga = () => {
    append({
      nik: "",
      nama: "",
      shdk: "",
    });
  };

  const removeAnggotaKeluarga = (index: number) => {
    if (fields.length > 1) {
      remove(index);
    }
  };

  const onSubmit = async (values: TUpdatePermohonanPindahSchema) => {
    try {
      setIsLoading(true);
      const result = await updatePermohonanPindahAction(permohonan.permohonanPindahId, values);

      if (result.status === 200) {
        toast.success(result.message);
        router.push(PATHS.PINDAH_REQUEST);
      } else {
        toast.error(result.message);
      }
    } catch (error) {
      toast.error("Terjadi kesalahan saat mengupdate permohonan pindah");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        {/* Basic form fields similar to create form but with existing data */}
        {/* Data Anggota Keluarga - Dynamic Fields */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle>Data Anggota Keluarga Yang Pindah</CardTitle>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={addAnggotaKeluarga}
            >
              <Plus className="h-4 w-4 mr-2" />
              Tambah Anggota
            </Button>
          </CardHeader>
          <CardContent className="space-y-4">
            {fields.map((field, index) => (
              <Card key={field.id} className="p-4">
                <div className="flex justify-between items-center mb-4">
                  <h4 className="text-sm font-medium">Anggota Keluarga {index + 1}</h4>
                  {fields.length > 1 && (
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => removeAnggotaKeluarga(index)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  )}
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <FormField
                    control={form.control}
                    name={`anggotaKeluarga.${index}.nik`}
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>NIK</FormLabel>
                        <FormControl>
                          <Input placeholder="NIK anggota keluarga" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name={`anggotaKeluarga.${index}.nama`}
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Nama Lengkap</FormLabel>
                        <FormControl>
                          <Input placeholder="Nama lengkap" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name={`anggotaKeluarga.${index}.shdk`}
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Status Hubungan Dalam Keluarga</FormLabel>
                        <FormControl>
                          <Input placeholder="Contoh: Kepala Keluarga, Istri, Anak" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </Card>
            ))}
          </CardContent>
        </Card>

        <div className="flex gap-4">
          <Button
            type="button"
            variant="outline"
            onClick={() => router.back()}
            className="flex-1"
          >
            Batal
          </Button>
          <Button type="submit" disabled={isLoading} className="flex-1">
            {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Update Permohonan
          </Button>
        </div>
      </form>
    </Form>
  );
}
