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
import { PermohonanSKD, StatusPermohonan } from "@/generated/prisma";
import { followUpPermohonanSKDSchema } from "@/lib/validators/permohonan-skd";
import { followUpPermohonanSKDAction } from "@/lib/server/actions/permohonan-skd";
import { zodResolver } from "@hookform/resolvers/zod";
import { FileText, Loader2 } from "lucide-react";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { Input } from "./ui/input";
import { FollowUpPermohonanSKDInput } from "@/lib/validators/permohonan-skd";

type PermohonanSKDWithUser = PermohonanSKD & {
  user: {
    userId: string;
    name: string;
    email: string;
  };
};

interface PermohonanSKDFollowUpModalProps {
  permohonan: PermohonanSKDWithUser;
}

export function PermohonanSKDFollowUpModal({ permohonan }: PermohonanSKDFollowUpModalProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const form = useForm<FollowUpPermohonanSKDInput>({
    resolver: zodResolver(followUpPermohonanSKDSchema),
    defaultValues: {
      permohonanSKDId: permohonan.permohonanSKDId,
      nomorPermohonan: permohonan.nomorPermohonan || "",
      statusPermohonan: permohonan.statusPermohonan,
      catatan: "",
    },
  });

  const onSubmit = async (data: FollowUpPermohonanSKDInput) => {
    try {
      setIsLoading(true);
      const formData = new FormData();

      Object.entries(data).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          formData.append(key, value.toString());
        }
      });

      const result = await followUpPermohonanSKDAction(formData);
      
      if (result.success) {
        toast.success(result.message);
        setIsOpen(false);
        form.reset();
      }
    } catch (error) {
      toast.error("Gagal melakukan tindak lanjut permohonan SKD");
      console.error("Follow up error:", error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button variant="outline">
          <FileText className="mr-2 h-4 w-4" />
          Tindak Lanjut
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Tindak Lanjut Permohonan SKD</DialogTitle>
          <DialogDescription>
            Update status dan berikan tindak lanjut untuk permohonan SKD atas nama{" "}
            <span className="font-semibold">{permohonan.nama}</span>.
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
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Pilih status permohonan" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value={StatusPermohonan.DIAJUKAN}>Diajukan</SelectItem>
                      <SelectItem value={StatusPermohonan.DISETUJUI}>Disetujui</SelectItem>
                      <SelectItem value={StatusPermohonan.DITOLAK}>Ditolak</SelectItem>
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
                onClick={() => setIsOpen(false)}
                disabled={isLoading}
              >
                Batal
              </Button>
              <Button type="submit" disabled={isLoading}>
                {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Simpan Tindak Lanjut
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
