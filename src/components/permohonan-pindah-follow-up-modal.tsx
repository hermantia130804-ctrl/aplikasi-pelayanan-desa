"use client";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
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
import { followUpPermohonanPindahAction } from "@/lib/server/actions/permohonan-pindah";
import {
  followUpPermohonanPindahSchema,
  TFollowUpPermohonanPindahSchema,
} from "@/lib/validators/permohonan-pindah";
import { PermohonanPindah } from "@/generated/prisma";
import { zodResolver } from "@hookform/resolvers/zod";
import { CheckCircle, Loader2 } from "lucide-react";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";

interface PermohonanPindahFollowUpModalProps {
  permohonan: PermohonanPindah;
}

export function PermohonanPindahFollowUpModal({
  permohonan,
}: PermohonanPindahFollowUpModalProps) {
  const [open, setOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const form = useForm<TFollowUpPermohonanPindahSchema>({
    resolver: zodResolver(followUpPermohonanPindahSchema),
    defaultValues: {
      permohonanPindahId: permohonan.permohonanPindahId,
      nomorPermohonan: permohonan.nomorPermohonan || "",
      statusPermohonan: permohonan.statusPermohonan,
      catatan: permohonan.catatan || "",
    },
  });

  const onSubmit = async (values: TFollowUpPermohonanPindahSchema) => {
    try {
      setIsLoading(true);
      const result = await followUpPermohonanPindahAction(values);

      if (result.status === 200) {
        toast.success(result.message);
        setOpen(false);
        form.reset();
      } else {
        toast.error(result.message);
      }
    } catch (error) {
      toast.error("Terjadi kesalahan saat melakukan tindak lanjut permohonan pindah");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm">
          <CheckCircle className="mr-2 h-4 w-4" />
          Tindak Lanjut
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Tindak Lanjut Permohonan Pindah</DialogTitle>
          <DialogDescription>
            Perbarui status dan informasi permohonan pindah {permohonan.nama}.
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="nomorPermohonan"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Nomor Permohonan</FormLabel>
                  <FormControl>
                    <Input placeholder="Masukkan nomor permohonan" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="statusPermohonan"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Status Permohonan</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Pilih status" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="DIAJUKAN">Diajukan</SelectItem>
                      <SelectItem value="DIPROSES">Diproses</SelectItem>
                      <SelectItem value="DISETUJUI">Disetujui</SelectItem>
                      <SelectItem value="DITOLAK">Ditolak</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="catatan"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Catatan</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Tambahkan catatan tindak lanjut"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <div className="flex justify-end space-x-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => setOpen(false)}
              >
                Batal
              </Button>
              <Button type="submit" disabled={isLoading}>
                {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Simpan
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
