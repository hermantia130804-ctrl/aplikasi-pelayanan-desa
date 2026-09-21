"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { PermohonanSKTM } from "@/generated/prisma";
import { updateStatusPermohonanSKTMAction } from "@/lib/server/actions/permohonan-sktm";
import { TUpdateStatusPermohonanSKTMSchema, updateStatusPermohonanSKTMSchema } from "@/lib/validators/permohonan-sktm";
import { zodResolver } from "@hookform/resolvers/zod";
import { ClipboardCheck, Loader2, Save, X } from "lucide-react";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { Input } from "./ui/input";

const statusOptions = [
  { value: "DIAJUKAN", label: "Diajukan", color: "bg-yellow-100 text-yellow-800" },
  { value: "DISETUJUI", label: "Disetujui", color: "bg-green-100 text-green-800" },
  { value: "DITOLAK", label: "Ditolak", color: "bg-red-100 text-red-800" },
];

export function PermohonanSKTMUpdateStatusModal({
  open,
  onOpenChange,
  permohonanSKTM,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  permohonanSKTM: PermohonanSKTM;
}) {
  const [loading, setLoading] = useState(false);
  const form = useForm<TUpdateStatusPermohonanSKTMSchema>({
    resolver: zodResolver(updateStatusPermohonanSKTMSchema),
    defaultValues: {
      nomorPermohonan: permohonanSKTM.nomorPermohonan || "",
      permohonanSKTMId: permohonanSKTM.permohonanSKTMId,
      statusPermohonan: permohonanSKTM.statusPermohonan,
      catatan: permohonanSKTM.catatan || "",
    },
  });

  const onSubmit = async (data: TUpdateStatusPermohonanSKTMSchema) => {
    try {
      setLoading(true);
      const response = await updateStatusPermohonanSKTMAction(data);
      if (response.status === 200) {
        toast.success(response.message);
        onOpenChange(false);
        window.location.reload(); // Refresh to show updated data
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
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <ClipboardCheck className="h-5 w-5" />
            Update Status Permohonan SKTM
          </DialogTitle>
          <DialogDescription>
            Perbarui status permohonan SKTM untuk{" "}
            <strong>{permohonanSKTM.nama}</strong>
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium">Status Saat Ini</label>
                <div className="mt-1">
                  <Badge className={statusOptions.find(s => s.value === permohonanSKTM.statusPermohonan)?.color}>
                    {statusOptions.find(s => s.value === permohonanSKTM.statusPermohonan)?.label}
                  </Badge>
                </div>
              </div>

              <FormField
                control={form.control}
                name="statusPermohonan"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Status Baru</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger className="w-full">
                          <SelectValue placeholder="Pilih status baru" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {statusOptions.map((status) => (
                          <SelectItem key={status.value} value={status.value}>
                            <div className="flex items-center gap-2">
                              <Badge className={status.color} variant="outline">
                                {status.label}
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
                    <FormLabel>Catatan</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="Masukkan catatan untuk perubahan status ini..."
                        className="resize-none"
                        rows={3}
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <DialogFooter className="gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
                disabled={loading}
              >
                <X className="h-4 w-4 mr-2" />
                Batal
              </Button>
              <Button type="submit" disabled={loading}>
                {loading ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Menyimpan...
                  </>
                ) : (
                  <>
                    <Save className="h-4 w-4 mr-2" />
                    Simpan Status
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
