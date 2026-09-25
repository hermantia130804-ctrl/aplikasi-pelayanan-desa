"use client";

import { Button } from "@/components/ui/button";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";

const schema = z.object({
  passwordLama: z.string().min(1, "Password lama wajib diisi"),
  passwordBaru: z.string().min(8, "Password baru minimal 8 karakter"),
  konfirmasiPassword: z.string().min(1, "Konfirmasi password wajib diisi"),
}).refine((d) => d.passwordBaru === d.konfirmasiPassword, {
  message: "Konfirmasi password tidak cocok",
  path: ["konfirmasiPassword"],
});

type TForm = z.infer<typeof schema>;

export function UbahPasswordForm() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const form = useForm<TForm>({
    resolver: zodResolver(schema),
    defaultValues: { passwordLama: "", passwordBaru: "", konfirmasiPassword: "" },
  });

  const onSubmit = async (values: TForm) => {
    try {
      setLoading(true);
      const { ubahPasswordAction } = await import("@/lib/server/actions/ubah-password");
      const res = await ubahPasswordAction(values);
      if (res.status === 200) {
        toast.success(res.message);
        form.reset();
        router.refresh();
      } else {
        toast.error(res.message);
      }
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Terjadi kesalahan");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <FormField control={form.control} name="passwordLama" render={({ field }) => (
          <FormItem>
            <FormLabel>Password Lama</FormLabel>
            <FormControl><Input type="password" {...field} /></FormControl>
            <FormMessage />
          </FormItem>
        )} />
        <FormField control={form.control} name="passwordBaru" render={({ field }) => (
          <FormItem>
            <FormLabel>Password Baru</FormLabel>
            <FormControl><Input type="password" placeholder="Minimal 8 karakter" {...field} /></FormControl>
            <FormMessage />
          </FormItem>
        )} />
        <FormField control={form.control} name="konfirmasiPassword" render={({ field }) => (
          <FormItem>
            <FormLabel>Konfirmasi Password Baru</FormLabel>
            <FormControl><Input type="password" {...field} /></FormControl>
            <FormMessage />
          </FormItem>
        )} />
        <Button type="submit" disabled={loading} className="w-full sm:w-auto">
          {loading ? "Menyimpan..." : "Ubah Password"}
        </Button>
      </form>
    </Form>
  );
}
