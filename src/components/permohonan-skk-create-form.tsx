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
import { PATHS } from "@/constants/paths";
import { createPermohonanSKKAction } from "@/lib/server/actions/permohonan-skk";
import { cn } from "@/lib/utils";
import {
  createPermohonanSKKSchema,
  TCreatePermohonanSKKSchema,
} from "@/lib/validators/permohonan-skk";
import { zodResolver } from "@hookform/resolvers/zod";
import { format } from "date-fns";
import { id } from "date-fns/locale";
import { CalendarIcon, Loader2Icon, SaveIcon } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";

export function PermohonanSKKCreateForm() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  const form = useForm<TCreatePermohonanSKKSchema>({
    resolver: zodResolver(createPermohonanSKKSchema),
    defaultValues: {
      nik: "",
      nama: "",
      agama: undefined,
      umur: 0,
      alamat: "",
      tanggalMeninggal: undefined,
      tempatMeninggal: "",
      catatan: "",
    },
  });

  const onSubmit = async (values: TCreatePermohonanSKKSchema) => {
    try {
      setLoading(true);
      const response = await createPermohonanSKKAction(values);
      if (response.status === 200) {
        toast.success(response.message);
        router.push("/permohonan-saya");
      } else {
        toast.error(response.message);
      }
    } catch (error) {
      if (error instanceof Error) {
        toast.error("Terjadi kesalahan pada server.");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
          {/* NIK */}
          <FormField
            control={form.control}
            name="nik"
            render={({ field }) => (
              <FormItem>
                <FormLabel>NIK *</FormLabel>
                <FormControl>
                  <Input
                    placeholder="Masukkan NIK (16 digit)"
                    maxLength={16}
                    {...field}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* Nama */}
          <FormField
            control={form.control}
            name="nama"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Nama Lengkap *</FormLabel>
                <FormControl>
                  <Input placeholder="Masukkan nama lengkap" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* Agama */}
          <FormField
            control={form.control}
            name="agama"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Agama *</FormLabel>
                <Select onValueChange={field.onChange} defaultValue={field.value}>
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

          {/* Umur */}
          <FormField
            control={form.control}
            name="umur"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Umur *</FormLabel>
                <FormControl>
                  <Input
                    type="number"
                    placeholder="Masukkan umur"
                    min={0}
                    max={150}
                    {...field}
                    onChange={(e) => field.onChange(parseInt(e.target.value) || 0)}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* Tanggal Meninggal */}
          <FormField
            control={form.control}
            name="tanggalMeninggal"
            render={({ field }) => (
              <FormItem className="flex flex-col">
                <FormLabel>Tanggal Meninggal</FormLabel>
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
                          format(field.value, "PPP", { locale: id })
                        ) : (
                          <span>Pilih tanggal meninggal</span>
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

          {/* Tempat Meninggal */}
          <FormField
            control={form.control}
            name="tempatMeninggal"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Tempat Meninggal</FormLabel>
                <FormControl>
                  <Input placeholder="Masukkan tempat meninggal" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        {/* Alamat */}
        <FormField
          control={form.control}
          name="alamat"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Alamat Lengkap *</FormLabel>
              <FormControl>
                <Textarea
                  placeholder="Masukkan alamat lengkap"
                  className="min-h-[100px]"
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Catatan */}
        <FormField
          control={form.control}
          name="catatan"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Catatan</FormLabel>
              <FormControl>
                <Textarea
                  placeholder="Masukkan catatan tambahan (opsional)"
                  className="min-h-[80px]"
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="flex justify-end gap-4">
          <Button
            type="button"
            variant="outline"
            onClick={() => router.push("/permohonan-saya")}
            disabled={loading}
          >
            Batal
          </Button>
          <Button type="submit" disabled={loading}>
            {loading ? (
              <>
                <Loader2Icon className="mr-2 h-4 w-4 animate-spin" />
                Menyimpan...
              </>
            ) : (
              <>
                <SaveIcon className="mr-2 h-4 w-4" />
                Simpan
              </>
            )}
          </Button>
        </div>
      </form>
    </Form>
  );
}
