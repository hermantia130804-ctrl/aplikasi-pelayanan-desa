"use client";

import { Button } from "@/components/ui/button";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { GambarUploadField } from "@/components/gambar-upload-field";
import { createBeritaAction, updateBeritaAction } from "@/lib/server/actions/berita";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { ArrowLeftIcon } from "lucide-react";
import { z } from "zod";

const schema = z.object({
    judul: z.string().min(5, "Judul minimal 5 karakter"),
    isi: z.string().min(20, "Isi berita minimal 20 karakter"),
    gambarUrl: z.string().optional(),
    youtubeId: z.string().optional(),
    tanggalKegiatan: z.string().min(1, "Tanggal kegiatan wajib diisi"),
}).refine(
    (d) => !!d.gambarUrl || !!d.youtubeId,
    { message: "Wajib mengunggah gambar atau menambahkan link video YouTube", path: ["isi"] }
);

type TBerita = {
    beritaId: string;
    judul: string;
    isi: string;
    gambarUrl: string | null;
    youtubeId: string | null;
    tanggalKegiatan: Date | string;
};

type BeritaFormProps = {
    beritaId?: string;
    defaultValues: {
        judul: string;
        isi: string;
        gambarUrl: string;
        youtubeId: string;
        tanggalKegiatan: string;
    };
};

export function BeritaForm({ beritaId, defaultValues }: BeritaFormProps) {
    const router = useRouter();
    const [loading, setLoading] = useState(false);
    const form = useForm({
        resolver: zodResolver(schema),
        defaultValues,
    });

    const isEdit = Boolean(beritaId);

    const onSubmit = async (values: z.infer<typeof schema>) => {
        try {
            setLoading(true);
            const tanggal = new Date(values.tanggalKegiatan);
            const payload = {
                judul: values.judul,
                isi: values.isi,
                gambarUrl: values.gambarUrl || undefined,
                youtubeId: values.youtubeId || undefined,
                tanggalKegiatan: tanggal,
            };

            const res = isEdit
                ? await updateBeritaAction(beritaId!, payload)
                : await createBeritaAction(payload);

            if (res.status === 200) {
                toast.success(res.message);
                router.push("/berita-kegiatan");
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
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                <FormField control={form.control} name="judul" render={({ field }) => (
                    <FormItem>
                        <FormLabel>Judul Berita</FormLabel>
                        <FormControl><Input placeholder="Contoh: Lomba Kemerdekaan RI di Lapangan Desa" {...field} /></FormControl>
                        <FormMessage />
                    </FormItem>
                )} />

                <FormField control={form.control} name="tanggalKegiatan" render={({ field }) => (
                    <FormItem>
                        <FormLabel>Tanggal Kegiatan</FormLabel>
                        <FormControl><Input type="date" {...field} /></FormControl>
                        <FormMessage />
                    </FormItem>
                )} />

                <FormField control={form.control} name="gambarUrl" render={({ field }) => (
                    <FormItem>
                        <FormLabel>Gambar Berita (Foto)</FormLabel>
                        <FormControl>
                            <GambarUploadField value={field.value ?? ""} onChange={field.onChange} disabled={loading} />
                        </FormControl>
                        <FormMessage />
                    </FormItem>
                )} />

                <FormField control={form.control} name="youtubeId" render={({ field }) => (
                    <FormItem>
                        <FormLabel>Link Video YouTube (Opsional)</FormLabel>
                        <FormControl>
                            <Input placeholder="Tempel link YouTube, contoh: https://youtu.be/abc123" {...field} />
                        </FormControl>
                        <FormMessage />
                    </FormItem>
                )} />

                <FormField control={form.control} name="isi" render={({ field }) => (
                    <FormItem>
                        <FormLabel>Isi Berita</FormLabel>
                        <FormControl>
                            <Textarea placeholder="Tulis isi berita kegiatan..." className="min-h-[180px]" {...field} />
                        </FormControl>
                        <FormMessage />
                    </FormItem>
                )} />

                <div className="flex gap-2">
                    <Button type="button" variant="outline" onClick={() => router.push("/berita-kegiatan")}>
                        <ArrowLeftIcon className="w-4 h-4" /> Kembali
                    </Button>
                    <Button type="submit" disabled={loading}>
                        {loading ? "Menyimpan..." : (isEdit ? "Simpan Perubahan" : "Publikasikan Berita")}
                    </Button>
                </div>
            </form>
        </Form>
    );
}