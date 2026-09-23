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
import { createPermohonanSKLMandiriAction } from "@/lib/server/actions/permohonan-skl-mandiri";
import { createPermohonanSKLSchema, TCreatePermohonanSKLSchema } from "@/lib/validators/permohonan-skl";
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

export const PermohonanSKLCreateForm = () => {
    const router = useRouter();
    const [loading, setLoading] = useState(false);
    const form = useForm<TCreatePermohonanSKLSchema>({
        resolver: zodResolver(createPermohonanSKLSchema),
        defaultValues: {
            nama: "",
            tempatLahir: "",
            tanggalLahir: moment().toDate(),
            jenisKelamin: "LAKI_LAKI",
            alamat: "",
            
            // Data Ayah
            namaAyah: "",
            nikAyah: "",
            pekerjaanAyah: "",
            tempatLahirAyah: "",
            tanggalLahirAyah: moment().toDate(),
            agamaAyah: "ISLAM",
            
            // Data Ibu
            namaIbu: "",
            nikIbu: "",
            pekerjaanIbu: "",
            tempatLahirIbu: "",
            tanggalLahirIbu: moment().toDate(),
            agamaIbu: "ISLAM",
            
            // Dokumen
            dokumenKK: "",
            dokumenPengantar: "",
            dokumenSuratLahir: "",
            catatan: "",
        },
    });

    const onSubmit = async (values: TCreatePermohonanSKLSchema) => {
        try {
            setLoading(true);
            const response = await createPermohonanSKLMandiriAction(values);
            if (response.status === 200) {
                toast.success(response.message);
                router.push("/permohonan-saya");
            } else {
                toast.error(response.message);
            }
        } catch (error) {
            if (error instanceof Error) {
                return toast.error("Terjadi kesalahan pada server.");
            }
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="space-y-6">
            <div className="flex items-center gap-4">
                <Button
                    variant="outline"
                    size="icon"
                    onClick={() => router.back()}
                >
                    <ArrowLeftIcon className="h-4 w-4" />
                </Button>

            </div>

            <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                    {/* Data Anak */}
                    <div className="space-y-4">
                        <div className="flex items-center gap-2">
                            <h2 className="text-lg font-semibold">Data Anak</h2>
                            <Separator className="flex-1" />
                        </div>
                        
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
                                        <Select
                                            onValueChange={field.onChange}
                                            defaultValue={field.value}
                                        >
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
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
                                    <FormItem>
                                        <FormLabel>Tanggal Lahir</FormLabel>
                                        <Popover>
                                            <PopoverTrigger asChild>
                                                <FormControl>
                                                    <Button
                                                        variant="outline"
                                                        className={cn(
                                                            "w-full pl-3 text-left font-normal",
                                                            !field.value && "text-muted-foreground"
                                                        )}
                                                    >
                                                        {field.value ? (
                                                            moment(field.value).format("DD/MM/YYYY")
                                                        ) : (
                                                            <span>Pilih tanggal</span>
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
                                        <Textarea placeholder="Masukkan alamat lengkap" {...field} />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                    </div>

                    {/* Data Ayah */}
                    <div className="space-y-4">
                        <div className="flex items-center gap-2">
                            <h2 className="text-lg font-semibold">Data Ayah</h2>
                            <Separator className="flex-1" />
                        </div>
                        
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <FormField
                                control={form.control}
                                name="namaAyah"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Nama Ayah</FormLabel>
                                        <FormControl>
                                            <Input placeholder="Masukkan nama ayah" {...field} />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                            
                            <FormField
                                control={form.control}
                                name="nikAyah"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>NIK Ayah</FormLabel>
                                        <FormControl>
                                            <Input placeholder="Masukkan NIK ayah (16 digit)" {...field} />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <FormField
                                control={form.control}
                                name="pekerjaanAyah"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Pekerjaan Ayah</FormLabel>
                                        <FormControl>
                                            <Input placeholder="Masukkan pekerjaan ayah" {...field} />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                            
                            <FormField
                                control={form.control}
                                name="agamaAyah"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Agama Ayah</FormLabel>
                                        <Select
                                            onValueChange={field.onChange}
                                            defaultValue={field.value}
                                        >
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
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <FormField
                                control={form.control}
                                name="tempatLahirAyah"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Tempat Lahir Ayah</FormLabel>
                                        <FormControl>
                                            <Input placeholder="Masukkan tempat lahir ayah" {...field} />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                            
                            <FormField
                                control={form.control}
                                name="tanggalLahirAyah"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Tanggal Lahir Ayah</FormLabel>
                                        <Popover>
                                            <PopoverTrigger asChild>
                                                <FormControl>
                                                    <Button
                                                        variant="outline"
                                                        className={cn(
                                                            "w-full pl-3 text-left font-normal",
                                                            !field.value && "text-muted-foreground"
                                                        )}
                                                    >
                                                        {field.value ? (
                                                            moment(field.value).format("DD/MM/YYYY")
                                                        ) : (
                                                            <span>Pilih tanggal</span>
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
                    </div>

                    {/* Data Ibu */}
                    <div className="space-y-4">
                        <div className="flex items-center gap-2">
                            <h2 className="text-lg font-semibold">Data Ibu</h2>
                            <Separator className="flex-1" />
                        </div>
                        
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <FormField
                                control={form.control}
                                name="namaIbu"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Nama Ibu</FormLabel>
                                        <FormControl>
                                            <Input placeholder="Masukkan nama ibu" {...field} />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                            
                            <FormField
                                control={form.control}
                                name="nikIbu"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>NIK Ibu</FormLabel>
                                        <FormControl>
                                            <Input placeholder="Masukkan NIK ibu (16 digit)" {...field} />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <FormField
                                control={form.control}
                                name="pekerjaanIbu"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Pekerjaan Ibu</FormLabel>
                                        <FormControl>
                                            <Input placeholder="Masukkan pekerjaan ibu" {...field} />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                            
                            <FormField
                                control={form.control}
                                name="agamaIbu"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Agama Ibu</FormLabel>
                                        <Select
                                            onValueChange={field.onChange}
                                            defaultValue={field.value}
                                        >
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
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <FormField
                                control={form.control}
                                name="tempatLahirIbu"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Tempat Lahir Ibu</FormLabel>
                                        <FormControl>
                                            <Input placeholder="Masukkan tempat lahir ibu" {...field} />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                            
                            <FormField
                                control={form.control}
                                name="tanggalLahirIbu"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Tanggal Lahir Ibu</FormLabel>
                                        <Popover>
                                            <PopoverTrigger asChild>
                                                <FormControl>
                                                    <Button
                                                        variant="outline"
                                                        className={cn(
                                                            "w-full pl-3 text-left font-normal",
                                                            !field.value && "text-muted-foreground"
                                                        )}
                                                    >
                                                        {field.value ? (
                                                            moment(field.value).format("DD/MM/YYYY")
                                                        ) : (
                                                            <span>Pilih tanggal</span>
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
                    </div>

                    {/* Dokumen */}
                    <div className="space-y-4">
                        <div className="flex items-center gap-2">
                            <h2 className="text-lg font-semibold">Dokumen Pendukung</h2>
                            <Separator className="flex-1" />
                        </div>
                        
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <FormField
                                control={form.control}
                                name="dokumenKK"
                                render={({ field }) => (
                                    <FormItem className="col-span-2">
                                        <FormLabel>Dokumen KK (PDF)</FormLabel>
                                        <FormControl>
                                            <div className="relative">
                                                <FileUploadField
                                                    value={field.value || ""}
                                                    onChange={field.onChange}
                                                    accept=".pdf"
                                                    placeholder="Klik untuk memilih dokumen KK (PDF)"
                                                    disabled={loading}
                                                    bucketName="kartu-keluarga"
                                                />
                                                {field.value && (
                                                    <span className="absolute top-2 right-2 text-green-600 flex items-center gap-1 text-xs font-medium">
                                                        <CheckCircle2 className="w-4 h-4" />
                                                        Berhasil diunggah
                                                    </span>
                                                )}
                                            </div>
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                        </div>
                        
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <FormField
                                control={form.control}
                                name="dokumenPengantar"
                                render={({ field }) => (
                                    <FormItem className="col-span-2">
                                        <FormLabel>Dokumen Pengantar (PDF)</FormLabel>
                                        <FormControl>
                                            <div className="relative">
                                                <FileUploadField
                                                    value={field.value || ""}
                                                    onChange={field.onChange}
                                                    accept=".pdf"
                                                    placeholder="Klik untuk memilih dokumen pengantar (PDF)"
                                                    disabled={loading}
                                                    bucketName="pengantar"
                                                />
                                                {field.value && (
                                                    <span className="absolute top-2 right-2 text-green-600 flex items-center gap-1 text-xs font-medium">
                                                        <CheckCircle2 className="w-4 h-4" />
                                                        Berhasil diunggah
                                                    </span>
                                                )}
                                            </div>
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                        </div>
                        
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <FormField
                                control={form.control}
                                name="dokumenSuratLahir"
                                render={({ field }) => (
                                    <FormItem className="col-span-2">
                                        <FormLabel>Dokumen Surat Lahir (PDF)</FormLabel>
                                        <FormControl>
                                            <div className="relative">
                                                <FileUploadField
                                                    value={field.value || ""}
                                                    onChange={field.onChange}
                                                    accept=".pdf"
                                                    placeholder="Klik untuk memilih dokumen surat lahir (PDF)"
                                                    disabled={loading}
                                                    bucketName="surat-lahir"
                                                />
                                                {field.value && (
                                                    <span className="absolute top-2 right-2 text-green-600 flex items-center gap-1 text-xs font-medium">
                                                        <CheckCircle2 className="w-4 h-4" />
                                                        Berhasil diunggah
                                                    </span>
                                                )}
                                            </div>
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                        </div>
                    </div>

                    {/* Catatan */}
                    <div className="space-y-4">
                        <div className="flex items-center gap-2">
                            <h2 className="text-lg font-semibold">Catatan</h2>
                            <Separator className="flex-1" />
                        </div>
                        
                        <FormField
                            control={form.control}
                            name="catatan"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Catatan Tambahan (Opsional)</FormLabel>
                                    <FormControl>
                                        <Textarea placeholder="Masukkan catatan tambahan jika diperlukan" {...field} />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                    </div>

                    <div className="flex justify-end gap-4">
                        <Button
                            type="button"
                            variant="outline"
                            onClick={() => router.back()}
                            disabled={loading}
                        >
                            Batal
                        </Button>
                        <Button type="submit" disabled={loading}>
                            {loading ? "Menyimpan..." : "Simpan Permohonan"}
                        </Button>
                    </div>
                </form>
            </Form>
        </div>
    );
};
