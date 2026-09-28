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
import { ArrowLeftIcon } from "lucide-react";

const schema = z.object({
    nama: z.string().min(3, "Nama minimal 3 karakter"),
    jabatan: z.string().min(3, "Jabatan minimal 3 karakter"),
    fotoUrl: z.string().optional(),
    urutan: z.coerce.number().int().min(1),
    tingkat: z.coerce.number().int().min(1).default(1),
});

type TStruktur = z.infer<typeof schema>;

export function StrukturForm({
    strukturId,
    defaultValues,
}: {
    strukturId?: string;
    defaultValues: TStruktur;
}) {
    const router = useRouter();
    const [loading, setLoading] = useState(false);
    const form = useForm({ resolver: zodResolver(schema), defaultValues });

    const uploadFoto = async (file: File): Promise<string | null> => {
        const formData = new FormData();
        formData.append("file", file);
        const { uploadFotoStrukturAction } = await import("@/lib/server/actions/upload-foto-struktur");
        const res = await uploadFotoStrukturAction(formData);
        if (res.url) return res.url;
        toast.error(res.error || "Gagal mengunggah foto");
        return null;
    };

    const onSubmit = async (values: TStruktur & { file?: File }) => {
        try {
            setLoading(true);
            const payload = { ...values };
            const fileInput = document.getElementById("foto-pick") as HTMLInputElement | null;
            const file = fileInput?.files?.[0];
            if (file) {
                const url = await uploadFoto(file);
                if (url) payload.fotoUrl = url;
            }

            const { createStrukturAction, updateStrukturAction } = await import("@/lib/server/actions/struktur-organisasi");
            const res = strukturId
                ? await updateStrukturAction(strukturId, payload)
                : await createStrukturAction(payload);

            if (res.status === 200) {
                toast.success(res.message);
                router.push("/struktur-organisasi");
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
            <form
                onSubmit={form.handleSubmit(onSubmit)}
                className="space-y-6"
                id="foto-form"
                encType="multipart/form-data"
            >
                <input type="file" id="foto-file" accept=".jpg,.jpeg,.png,.webp" className="hidden" />

                <FormField control={form.control} name="nama" render={({ field }) => (
                    <FormItem>
                        <FormLabel>Nama</FormLabel>
                        <FormControl><Input placeholder="Nama lengkap" {...field} /></FormControl>
                        <FormMessage />
                    </FormItem>
                )} />
                <FormField control={form.control} name="jabatan" render={({ field }) => (
                    <FormItem>
                        <FormLabel>Jabatan</FormLabel>
                        <FormControl><Input placeholder="Contoh: Kepala Desa" {...field} /></FormControl>
                        <FormMessage />
                    </FormItem>
                )} />
                <FormField control={form.control} name="urutan" render={({ field }) => (
                    <FormItem>
                        <FormLabel>Urutan Tampil (angka)</FormLabel>
                        <FormControl><Input type="number" min={1} {...field} /></FormControl>
                        <FormMessage />
                    </FormItem>
                )} />

                <FormField control={form.control} name="tingkat" render={({ field }) => (
                    <FormItem>
                        <FormLabel>Tingkat Hierarki (angka)</FormLabel>
                        <FormControl><Input type="number" min={1} {...field} /></FormControl>
                        <FormMessage />
                        <p className="text-xs text-muted-foreground">1 = paling atas (Kepala Desa), 2 = baris kedua, dst.</p>
                    </FormItem>
                )} />
                <div>
                    <FormLabel>Foto</FormLabel>
                    <div className="mt-2">
                        <input type="file" accept=".jpg,.jpeg,.png,.webp" onChange={(e) => e.target} className="text-sm" id="foto-pick" />
                        <p className="text-xs text-muted-foreground mt-1">JPG/PNG/WebP maksimal 3 MB</p>
                    </div>
                </div>

                <div className="flex gap-2">
                    <Button type="button" variant="outline" onClick={() => router.push("/struktur-organisasi")}>
                        <ArrowLeftIcon className="w-4 h-4" /> Kembali
                    </Button>
                    <Button type="submit" disabled={loading}>
                        {loading ? "Menyimpan..." : "Simpan"}
                    </Button>
                </div>
            </form>
        </Form>
    );
}