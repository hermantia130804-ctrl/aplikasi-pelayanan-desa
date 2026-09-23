"use client";

import { Button } from "@/components/ui/button";
import {
    Form,
    FormControl,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { PATHS } from "@/constants/paths";
import { createPermohonanSKTMMandiriAction } from "@/lib/server/actions/permohonan-sktm-mandiri";
import { createPermohonanSKTMSchema, TCreatePermohonanSKTMSchema } from "@/lib/validators/permohonan-sktm";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";

import { Calendar } from "@/components/ui/calendar";
import { FileUploadField } from "@/components/ui/file-upload-field";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";
import { ArrowLeftIcon, CalendarIcon, CheckCircle2 } from "lucide-react";
import moment from "moment";
import Link from "next/link";

export const PermohonanSKTMCreateForm = () => {
    const router = useRouter();
    const [loading, setLoading] = useState(false);
    const form = useForm<TCreatePermohonanSKTMSchema>({
        resolver: zodResolver(createPermohonanSKTMSchema),
        defaultValues: {
            nik: "",
            nama: "",
            agama: "ISLAM",
            tempatLahir: "",
            jenisKelamin: "LAKI_LAKI",
            alamat: "",
            keterangan: "",
            catatan: "",
            dokumenKK: "",
            dokumenKTP: "",
            dokumenPengantar: "",
        },
    });

    const onSubmit = async (data: TCreatePermohonanSKTMSchema) => {
        try {
            setLoading(true);
            const response = await createPermohonanSKTMMandiriAction(data);
            if (response.status === 200) {
                toast.success(response.message);
                router.push("/permohonan-saya");
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
        <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                <div className="flex items-center gap-4">
                    <Button type="button" variant="outline" size="icon" asChild>
                        <Link href={PATHS.SKTM_REQUEST}>
                            <ArrowLeftIcon className="h-4 w-4" />
                        </Link>
                    </Button>

                </div>

                <Separator />

                {/* Data Pemohon */}
                <div className="space-y-4">
                    <h4 className="text-md font-medium">Data Pemohon</h4>
                    <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                        <FormField
                            control={form.control}
                            name="nik"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>NIK</FormLabel>
                                    <FormControl>
                                        <Input placeholder="Masukkan NIK" {...field} />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                        <FormField
                            control={form.control}
                            name="nama"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Nama Lengkap</FormLabel>
                                    <FormControl>
                                        <Input placeholder="Masukkan nama lengkap" {...field} />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                        <FormField
                            control={form.control}
                            name="jenisKelamin"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Jenis Kelamin</FormLabel>
                                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                                        <FormControl>
                                            <SelectTrigger className="w-full">
                                                <SelectValue placeholder="Pilih jenis kelamin" />
                                            </SelectTrigger>
                                        </FormControl>
                                        <SelectContent>
                                            <SelectItem value="LAKI_LAKI">Laki-laki</SelectItem>
                                            <SelectItem value="PEREMPUAN">Perempuan</SelectItem>
                                        </SelectContent>
                                    </Select>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                        <FormField
                            control={form.control}
                            name="agama"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Agama</FormLabel>
                                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                                        <FormControl>
                                            <SelectTrigger className="w-full">
                                                <SelectValue placeholder="Pilih agama" />
                                            </SelectTrigger>
                                        </FormControl>
                                        <SelectContent>
                                            <SelectItem value="ISLAM">Islam</SelectItem>
                                            <SelectItem value="KRISTEN">Kristen</SelectItem>
                                            <SelectItem value="KATOLIK">Katolik</SelectItem>
                                            <SelectItem value="HINDU">Hindu</SelectItem>
                                            <SelectItem value="BUDDHA">Buddha</SelectItem>
                                            <SelectItem value="KONGHUCU">Konghucu</SelectItem>
                                        </SelectContent>
                                    </Select>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                        <FormField
                            control={form.control}
                            name="tempatLahir"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Tempat Lahir</FormLabel>
                                    <FormControl>
                                        <Input placeholder="Masukkan tempat lahir" {...field} />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                        <FormField
                            control={form.control}
                            name="tanggalLahir"
                            render={({ field }) => (
                                <FormItem className="flex flex-col">
                                    <FormLabel>Tanggal Lahir</FormLabel>
                                    <Popover>
                                        <PopoverTrigger asChild>
                                            <FormControl>
                                                <Button
                                                    variant={"outline"}
                                                    className={cn(
                                                        "w-full pl-3 text-left font-normal",
                                                        !field.value && "text-muted-foreground"
                                                    )}
                                                >
                                                    {field.value ? (
                                                        moment(field.value).format("DD/MM/YYYY")
                                                    ) : (
                                                        <span>Pilih tanggal lahir</span>
                                                    )}
                                                    <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                                                </Button>
                                            </FormControl>
                                        </PopoverTrigger>
                                        <PopoverContent className="w-auto p-0" align="start">
                                            <Calendar
                                                mode="single"
                                                selected={field.value}
                                                onSelect={field.onChange}
                                                disabled={(date) =>
                                                    date > new Date() || date < new Date("1900-01-01")
                                                }
                                                initialFocus
                                            />
                                        </PopoverContent>
                                    </Popover>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                    </div>
                    <FormField
                        control={form.control}
                        name="alamat"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>Alamat</FormLabel>
                                <FormControl>
                                    <Textarea 
                                        placeholder="Masukkan alamat lengkap" 
                                        className="resize-none"
                                        {...field} 
                                    />
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                        )}
                    />
                </div>

                <Separator />

                {/* Keterangan */}
                <div className="space-y-4">
                    <h4 className="text-md font-medium">Keterangan</h4>
                    <FormField
                        control={form.control}
                        name="keterangan"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>Keterangan</FormLabel>
                                <FormControl>
                                    <Textarea 
                                        placeholder="Masukkan keterangan mengenai kondisi ekonomi atau keperluan SKTM" 
                                        className="resize-none"
                                        rows={4}
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
                                        placeholder="Masukkan catatan tambahan jika ada" 
                                        className="resize-none"
                                        {...field} 
                                    />
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                        )}
                    />
                </div>

                <Separator />

                {/* Dokumen Pendukung */}
                <div className="space-y-4">
                    <h4 className="text-md font-medium">Dokumen Pendukung</h4>
                    <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                        <FormField
                            control={form.control}
                            name="dokumenKK"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Dokumen Kartu Keluarga</FormLabel>
                                    <FormControl>
                                        <FileUploadField
                                            value={field.value}
                                            onChange={field.onChange}
                                            accept=".pdf"
                                            placeholder="Upload dokumen KK (PDF)"
                                            bucketName="kartu-keluarga"
                                        />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                        <FormField
                            control={form.control}
                            name="dokumenKTP"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Dokumen KTP</FormLabel>
                                    <FormControl>
                                        <FileUploadField
                                            value={field.value}
                                            onChange={field.onChange}
                                            accept=".pdf"
                                            placeholder="Upload dokumen KTP (PDF)"
                                            bucketName="ktp"
                                        />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                        <FormField
                            control={form.control}
                            name="dokumenPengantar"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Dokumen Pengantar</FormLabel>
                                    <FormControl>
                                        <FileUploadField
                                            value={field.value}
                                            onChange={field.onChange}
                                            accept=".pdf"
                                            placeholder="Upload dokumen pengantar (PDF)"
                                            bucketName="pengantar"
                                        />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                    </div>
                </div>

                <Separator />

                <div className="flex justify-end gap-4">
                    <Button type="button" variant="outline" asChild>
                        <Link href={PATHS.SKTM_REQUEST}>Batal</Link>
                    </Button>
                    <Button type="submit" disabled={loading}>
                        {loading ? "Menyimpan..." : "Simpan Permohonan"}
                        {!loading && <CheckCircle2 className="ml-2 h-4 w-4" />}
                    </Button>
                </div>
            </form>
        </Form>
    );
};
