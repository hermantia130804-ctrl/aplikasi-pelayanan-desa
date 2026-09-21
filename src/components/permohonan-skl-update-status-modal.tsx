"use client";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { PermohonanSKL } from "@/generated/prisma";
import { updatePermohonanSKLStatusAction } from "@/lib/server/actions/permohonan-skl";
import { TUpdatePermohonanSKLStatusSchema, updatePermohonanSKLStatusSchema } from "@/lib/validators/permohonan-skl";
import { zodResolver } from "@hookform/resolvers/zod";
import { ClipboardCheck, Loader2, Save, X } from "lucide-react";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";

const statusOptions = [
  { value: "DIAJUKAN", label: "Diajukan", color: "bg-yellow-100 text-yellow-800" },
  { value: "DISETUJUI", label: "Disetujui", color: "bg-green-100 text-green-800" },
  { value: "DITOLAK", label: "Ditolak", color: "bg-red-100 text-red-800" },
];

export function PermohonanSKLUpdateStatusModal({
  open,
  onOpenChange,
  permohonanSKL,
  onSuccess,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  permohonanSKL: PermohonanSKL;
  onSuccess?: () => void;
}) {
  const [loading, setLoading] = useState(false);
  const form = useForm<TUpdatePermohonanSKLStatusSchema>({
    resolver: zodResolver(updatePermohonanSKLStatusSchema),
    defaultValues: {
      nomorPermohonan: permohonanSKL.nomorPermohonan || "",
      statusPermohonan: permohonanSKL.statusPermohonan,
      catatan: permohonanSKL.catatan || "",
    },
  });

  const onSubmit = async (data: TUpdatePermohonanSKLStatusSchema) => {
    try {
      setLoading(true);
      const response = await updatePermohonanSKLStatusAction(permohonanSKL.permohonanSKLId, data);
      
      if (response.status === 200) {
        toast.success(response.message);
        onOpenChange(false);
        onSuccess?.();
      } else {
        toast.error(response.message);
      }
    } catch (error) {
      if (error instanceof Error) {
        toast.error(error.message);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    if (!loading) {
      onOpenChange(false);
      form.reset();
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <ClipboardCheck className="h-5 w-5" />
            Tindak Lanjut Permohonan SKL
          </DialogTitle>
          <DialogDescription>
            Perbarui status dan informasi permohonan SKL atas nama <strong>{permohonanSKL.nama}</strong>
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium">Status Saat Ini:</span>
                <Badge className={statusOptions.find(s => s.value === permohonanSKL.statusPermohonan)?.color}>
                  {statusOptions.find(s => s.value === permohonanSKL.statusPermohonan)?.label}
                </Badge>
              </div>

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
                        placeholder="Masukkan nomor permohonan" 
                        {...field} 
                        disabled={loading}
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
                        placeholder="Tambahkan catatan jika diperlukan..."
                        className="resize-none"
                        rows={3}
                        {...field}
                        disabled={loading}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <DialogFooter className="flex gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={handleClose}
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
