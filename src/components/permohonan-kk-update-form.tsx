"use client";

import { Button } from "@/components/ui/button";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { FileUploadField } from "@/components/ui/file-upload-field";
import { Separator } from "@/components/ui/separator";
import { updatePermohonanKKAction } from "@/lib/server/actions/permohonan-kk";
import { createPermohonanKKSchema, TCreatePermohonanKKSchema } from "@/lib/validators/permohonan-kk";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { ArrowLeftIcon, CheckCircle2 } from "lucide-react";

const alasanOptions = [
    { value: "BARU", label: "Pengajuan KK Baru (pernikahan, kelahiran, kepala keluarga baru)" },
    { value: "PERUBAHAN_DATA", label: "Perubahan Data KK" },
    { value: "PENGGANTIAN", label: "Penggantian KK (rusak/hilang)" },
    { value: "PEMISAHAN_KK", label: "Pemisahan KK (keluar dari KK asal)" },
];

type PermohonanKKUpdateFormProps = {
    permohonanKKId: string;
    defaultValues: TCreatePermohonanKKSchema;
};

export const PermohonanKKUpdateForm = ({ permohonanKKId, defaultValues }: PermohonanKKUpdateFormProps) => {
    const router = useRouter();
    const [loading, setLoading] = useState(false);
    const form = useForm<TCreatePermohonanKKSchema>({
        resolver: zodResolver(createPermohonanKKSchema),
        defaultValues,
    });

    const onSubmit = async (values: TCreatePermohonanKKSchema) => {
        try {
            setLoading(true);
            const response = await updatePermohonanKKAction(permohonanKKId, values);
            if (response.status === 200) {
                toast.success(response.message);
                router.push("/permohonan-kk");
            } else {
                toast.error(response.message);
            }
        } catch (error) {
            if (error instanceof Error) return toast.error("Terjadi kesalahan pada server.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6 pb-24">
                <h2 className="text-base font-bold mb-1">I. Data Pemohon</h2>
                <Separator className="mb-4" />
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <FormField control={form.control} name="nama" render={({ field }) => (
                        <FormItem>
                            <FormLabel>Nama Lengkap (Kepala Keluarga)</FormLabel>
                            <FormControl><Input {...field} /></FormControl>
                            <FormMessage />
                        </FormItem>
                    )} />
                    <FormField control={form.control} name="nik" render={({ field }) => (
                        <FormItem>
                            <FormLabel>NIK</FormLabel>
                            <FormControl><Input maxLength={16} inputMode="numeric" {...field} /></FormControl>
                            <FormMessage />
                        </FormItem>
                    )} />
                </div>
                <FormField control={form.control} name="noKKLama" render={({ field }) => (
                    <FormItem>
                        <FormLabel>Nomor KK Lama (opsional)</FormLabel>
                        <FormControl><Input {...field} /></FormControl>
                        <FormMessage />
                    </FormItem>
                )} />
                <FormField control={form.control} name="alasanPermohonan" render={({ field }) => (
                    <FormItem>
                        <FormLabel>Alasan Permohonan</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                            <FormControl>
                                <SelectTrigger className="w-full"><SelectValue placeholder="Pilih alasan permohonan" /></SelectTrigger>
                            </FormControl>
                            <SelectContent>
                                {alasanOptions.map((o) => (
                                    <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                        <FormMessage />
                    </FormItem>
                )} />

                <h2 className="text-base font-bold mt-8 mb-1">II. Alamat</h2>
                <Separator className="mb-4" />
                <FormField control={form.control} name="alamat" render={({ field }) => (
                    <FormItem>
                        <FormLabel>Alamat Lengkap</FormLabel>
                        <FormControl><Textarea {...field} /></FormControl>
                        <FormMessage />
                    </FormItem>
                )} />
                <div className="flex gap-2 w-full">
                    <div className="flex-1">
                        <FormField control={form.control} name="rt" render={({ field }) => (
                            <FormItem>
                                <FormLabel>RT</FormLabel>
                                <FormControl><Input maxLength={3} inputMode="numeric" {...field} /></FormControl>
                                <FormMessage />
                            </FormItem>
                        )} />
                    </div>
                    <span className="flex items-center font-bold text-lg">/</span>
                    <div className="flex-1">
                        <FormField control={form.control} name="rw" render={({ field }) => (
                            <FormItem>
                                <FormLabel>RW</FormLabel>
                                <FormControl><Input maxLength={3} inputMode="numeric" {...field} /></FormControl>
                                <FormMessage />
                            </FormItem>
                        )} />
                    </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <FormField control={form.control} name="provinsi" render={({ field }) => (
                        <FormItem><FormLabel>Provinsi</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
                    )} />
                    <FormField control={form.control} name="kabupaten" render={({ field }) => (
                        <FormItem><FormLabel>Kabupaten</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
                    )} />
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <FormField control={form.control} name="kecamatan" render={({ field }) => (
                        <FormItem><FormLabel>Kecamatan</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
                    )} />
                    <FormField control={form.control} name="desa" render={({ field }) => (
                        <FormItem><FormLabel>Desa</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
                    )} />
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <FormField control={form.control} name="kodePos" render={({ field }) => (
                        <FormItem><FormLabel>Kode Pos</FormLabel><FormControl><Input maxLength={5} inputMode="numeric" {...field} /></FormControl><FormMessage /></FormItem>
                    )} />
                </div>

                <h2 className="text-base font-bold mt-8 mb-1">III. Dokumen</h2>
                <Separator className="mb-4" />
                <FormField control={form.control} name="dokumenKTP" render={({ field }) => (
                    <FormItem>
                        <FormLabel>Scan KTP Pemohon (PDF)</FormLabel>
                        <FormControl>
                            <div className="relative">
                                <FileUploadField value={field.value || ""} onChange={field.onChange} accept=".pdf" placeholder="Klik untuk mengunggah scan KTP (PDF)" disabled={loading} bucketName="ktp" />
                                {field.value && <span className="absolute top-2 right-2 text-green-600 flex items-center gap-1 text-xs font-medium"><CheckCircle2 className="w-4 h-4" />Berhasil diunggah</span>}
                            </div>
                        </FormControl>
                        <FormMessage />
                    </FormItem>
                )} />
                <FormField control={form.control} name="dokumenAkta" render={({ field }) => (
                    <FormItem>
                        <FormLabel>Scan Akta (PDF, opsional)</FormLabel>
                        <FormControl>
                            <div className="relative">
                                <FileUploadField value={field.value || ""} onChange={field.onChange} accept=".pdf" placeholder="Klik untuk mengunggah akta (PDF)" disabled={loading} bucketName="akta" />
                                {field.value && <span className="absolute top-2 right-2 text-green-600 flex items-center gap-1 text-xs font-medium"><CheckCircle2 className="w-4 h-4" />Berhasil diunggah</span>}
                            </div>
                        </FormControl>
                        <FormMessage />
                    </FormItem>
                )} />
                <FormField control={form.control} name="dokumenPengantar" render={({ field }) => (
                    <FormItem>
                        <FormLabel>Surat Pengantar RT/RW (PDF, opsional)</FormLabel>
                        <FormControl>
                            <div className="relative">
                                <FileUploadField value={field.value || ""} onChange={field.onChange} accept=".pdf" placeholder="Klik untuk mengunggah surat pengantar (PDF)" disabled={loading} bucketName="pengantar" />
                                {field.value && <span className="absolute top-2 right-2 text-green-600 flex items-center gap-1 text-xs font-medium"><CheckCircle2 className="w-4 h-4" />Berhasil diunggah</span>}
                            </div>
                        </FormControl>
                        <FormMessage />
                    </FormItem>
                )} />
                <FormField control={form.control} name="catatan" render={({ field }) => (
                    <FormItem>
                        <FormLabel>Catatan (Opsional)</FormLabel>
                        <FormControl><Textarea {...field} /></FormControl>
                        <FormMessage />
                    </FormItem>
                )} />
                <div className="flex justify-end gap-2 fixed md:static bottom-0 left-0 w-full bg-white md:bg-transparent z-20 p-4 md:p-0 border-t md:border-0">
                    <Button type="button" variant="outline" className="w-full md:w-auto" onClick={() => router.push("/permohonan-kk")}>
                        <ArrowLeftIcon className="w-4 h-4" />
                        Kembali
                    </Button>
                    <Button type="submit" disabled={loading} className="w-full md:w-auto">
                        {loading ? "Menyimpan..." : "Simpan Perubahan"}
                    </Button>
                </div>
            </form>
        </Form>
    );
};
