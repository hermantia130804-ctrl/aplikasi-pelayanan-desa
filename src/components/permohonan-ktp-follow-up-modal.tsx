"use client";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { StatusPermohonan } from "@/generated/prisma";
import { followUpPermohonanKTPAction } from "@/lib/server/actions/permohonan-ktp";
import { followUpPermohonanKTPSchema, TFollowUpPermohonanKTPSchema } from "@/lib/validators/permohonan-ktp";
import { zodResolver } from "@hookform/resolvers/zod";
import { ClipboardCheck, Loader2, Save, X } from "lucide-react";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";

const statusOptions = [
  { value: "DIAJUKAN", label: "Diajukan", color: "bg-yellow-100 text-yellow-800" },
  { value: "DISETUJUI", label: "Disetujui", color: "bg-blue-100 text-blue-800" },
  { value: "DITOLAK", label: "Ditolak", color: "bg-red-100 text-red-800" },
];

type PermohonanKTPFollowUpModalProps = {
  permohonanKtpId: string;
  statusPermohonan: StatusPermohonan;
  catatan?: string;
  nomorPermohonan?: string;
};

export const PermohonanKTPFollowUpModal = ({
  permohonanKtpId,
  statusPermohonan,
  catatan,
  nomorPermohonan,
}: PermohonanKTPFollowUpModalProps) => {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const form = useForm<TFollowUpPermohonanKTPSchema>({
    resolver: zodResolver(followUpPermohonanKTPSchema),
    defaultValues: {
      permohonanKtpId,
      statusPermohonan,
      nomorPermohonan,
      catatan,
    },
  });

  const onSubmit = async (values: TFollowUpPermohonanKTPSchema) => {
    try {
      setLoading(true);
      const res = await followUpPermohonanKTPAction(values);
      toast.success(res.message);
    } catch (e) {
      if (e instanceof Error) toast.error(e.message);
    } finally {
      setLoading(false);
      setOpen(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="default">
          <ClipboardCheck className="w-4 h-4 mr-1" />
          Tindak Lanjut
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-md w-full">
        <DialogHeader className="flex flex-col items-center gap-2">
          <ClipboardCheck className="w-8 h-8 text-primary mx-auto" />
          <DialogTitle className="text-center">Tindak Lanjut Permohonan KTP</DialogTitle>
          <DialogDescription className="text-center text-sm text-muted-foreground">
            Pilih status terbaru permohonan dan berikan catatan jika diperlukan.
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6 mt-2">
            <FormField
              control={form.control}
              name="statusPermohonan"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Status Permohonan</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger className="h-12 text-base w-full">
                        <SelectValue placeholder="Pilih status" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {statusOptions.map(opt => (
                        <SelectItem key={opt.value} value={opt.value}>
                          <Badge className={opt.color + " px-2 py-1 mr-2"}>{opt.label}</Badge>
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
                    <Input placeholder="Masukkan nomor permohonan" {...field} />
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
                      placeholder="Tulis catatan untuk pemohon atau internal (opsional)"
                      className="min-h-[90px] text-base"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <DialogFooter className="flex gap-2 mt-4">
              <Button type="button" variant="outline" onClick={() => setOpen(false)} disabled={loading}>
                <X className="w-4 h-4 mr-1" />
                Batal
              </Button>
              <Button type="submit" disabled={loading} className="flex items-center">
                {loading && <Loader2 className="w-4 h-4 animate-spin mr-1" />}
                <Save className="w-4 h-4 mr-1" />
                Simpan
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
} 