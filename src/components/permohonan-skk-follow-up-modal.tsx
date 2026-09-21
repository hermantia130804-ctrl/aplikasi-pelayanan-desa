"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { StatusPermohonan } from "@/generated/prisma";
import { followUpPermohonanSKKAction } from "@/lib/server/actions/permohonan-skk";
import { TFollUpPermohonanSKKSchema, followUpPermohonanSKKSchema } from "@/lib/validators/permohonan-skk";
import { zodResolver } from "@hookform/resolvers/zod";
import { ClipboardCheck, Loader2, Save, X } from "lucide-react";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { Input } from "./ui/input";
import { useRouter } from "next/navigation";

const statusOptions = [
  { value: "DIAJUKAN", label: "Diajukan", color: "bg-yellow-100 text-yellow-800" },
  { value: "DISETUJUI", label: "Disetujui", color: "bg-green-100 text-green-800" },
  { value: "DITOLAK", label: "Ditolak", color: "bg-red-100 text-red-800" },
];

type PermohonanSKKFollowUpModalProps = {
  permohonanSKKId: string;
  nomorPermohonan: string;
  statusPermohonan: StatusPermohonan;
  catatan?: string;
}

export function PermohonanSKKFollowUpModal({
  permohonanSKKId,
  nomorPermohonan,
  statusPermohonan,
  catatan,
}: PermohonanSKKFollowUpModalProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);

  const form = useForm<TFollUpPermohonanSKKSchema>({
    resolver: zodResolver(followUpPermohonanSKKSchema),
    defaultValues: {
      permohonanSKKId,
      statusPermohonan,
      nomorPermohonan: nomorPermohonan || "",
      catatan: catatan || "",
    },
  });

  const onSubmit = async (values: TFollUpPermohonanSKKSchema) => {
    try {
      setLoading(true);
      const response = await followUpPermohonanSKKAction(values);
      toast.success(response.message);
      router.refresh();
    } catch (error) {
      if (error instanceof Error) toast.error(error.message);
    } finally {
      setLoading(false);
      setOpen(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <ClipboardCheck className="h-5 w-5" />
            Update Status Permohonan SKK
          </DialogTitle>
          <DialogDescription>
            Update status permohonan SKK untuk <strong>{permohonanSKKId}</strong>
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
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder="Pilih status" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {statusOptions.map((option) => (
                        <SelectItem key={option.value} value={option.value}>
                          <div className="flex items-center gap-2">
                            <Badge className={option.color} variant="outline">
                              {option.label}
                            </Badge>
                          </div>
                        </SelectItem>
                      ))}
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
                  <FormLabel>Nomor Permohonan</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="Masukkan nomor permohonan"
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
                  <FormLabel>Catatan</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Masukkan catatan untuk perubahan status (opsional)"
                      className="min-h-[80px]"
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
                disabled={loading}
              >
                <X className="mr-2 h-4 w-4" />
                Batal
              </Button>
              <Button type="submit" disabled={loading}>
                {loading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Menyimpan...
                  </>
                ) : (
                  <>
                    <Save className="mr-2 h-4 w-4" />
                    Simpan
                  </>
                )}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
