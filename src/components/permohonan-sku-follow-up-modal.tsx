"use client";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { PermohonanSKU } from "@/generated/prisma";
import { followUpPermohonanSKUAction } from "@/lib/server/actions/permohonan-sku";
import {
  followUpPermohonanSKUSchema,
  TFollowUpPermohonanSKUSchema,
} from "@/lib/validators/permohonan-sku";
import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2, Settings } from "lucide-react";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { Input } from "./ui/input";

type PermohonanSKUWithUser = PermohonanSKU & {
  user: {
    userId: string;
    name: string;
    email: string;
    role: string;
  };
};

interface PermohonanSKUFollowUpModalProps {
  permohonan: PermohonanSKUWithUser;
}

export function PermohonanSKUFollowUpModal({
  permohonan,
}: PermohonanSKUFollowUpModalProps) {
  const [open, setOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const form = useForm<TFollowUpPermohonanSKUSchema>({
    resolver: zodResolver(followUpPermohonanSKUSchema),
    defaultValues: {
      permohonanSKUId: permohonan.permohonanSKUId,
      nomorPermohonan: permohonan.nomorPermohonan || "",
      statusPermohonan: permohonan.statusPermohonan,
      catatan: "",
    },
  });

  const onSubmit = async (values: TFollowUpPermohonanSKUSchema) => {
    try {
      setIsLoading(true);
      const result = await followUpPermohonanSKUAction(values);

      if (result.status === 200) {
        toast.success(result.message);
        setOpen(false);
        form.reset();
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
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline">
          <Settings className="mr-2 h-4 w-4" />
          Tindak Lanjut
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Tindak Lanjut Permohonan SKU</DialogTitle>
          <DialogDescription>
            Ubah status permohonan SKU atas nama{" "}
            <span className="font-semibold">{permohonan.nama}</span>
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
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
              name="nomorPermohonan"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Nomor Permohonan (Opsional)</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="Masukkan nomor permohonan..."
                      {...field}
                    />
                  </FormControl>
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
                      placeholder="Masukkan catatan tindak lanjut..."
                      className="resize-none"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => setOpen(false)}
                disabled={isLoading}
              >
                Batal
              </Button>
              <Button type="submit" disabled={isLoading}>
                {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Simpan
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
