"use client";

import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
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
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { FileUploadField } from "@/components/ui/file-upload-field";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PATHS } from "@/constants/paths";
import { createPermohonanPindahAction } from "@/lib/server/actions/permohonan-pindah";
import { cn } from "@/lib/utils";
import {
  createPermohonanPindahSchema,
  TCreatePermohonanPindahSchema,
} from "@/lib/validators/permohonan-pindah";
import { zodResolver } from "@hookform/resolvers/zod";
import { format } from "date-fns";
import { id } from "date-fns/locale";
import { CalendarIcon, CheckCircle2, Loader2, Plus, Trash2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useForm, useFieldArray } from "react-hook-form";
import { toast } from "sonner";

export function PermohonanPindahCreateForm() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);

  const form = useForm<TCreatePermohonanPindahSchema>({
    resolver: zodResolver(createPermohonanPindahSchema),
    defaultValues: {
      jenisPermohonanPindah: "SKP",
      nik: "",
      nama: "",
      alamatAsal: "",
      rtAsal: "",
      rwAsal: "",
      desaAsal: "",
      kecamatanAsal: "",
      kabupatenAsal: "",
      provinsiAsal: "",
      klarifikasiKepindahan: "",
      jenisKepindahan: "",
      alasanPindah: "",
      anggotaKeluargaYangPindah: "",
      alamatTujuan: "",
      rtTujuan: "",
      rwTujuan: "",
      desaTujuan: "",
      kecamatanTujuan: "",
      kabupatenTujuan: "",
      provinsiTujuan: "",
      catatan: "",
      anggotaKeluarga: [
        {
          nik: "",
          nama: "",
          shdk: "",
        },
      ],
    },
  });

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: "anggotaKeluarga",
  });

  const jenisPermohonan = form.watch("jenisPermohonanPindah");

  const addAnggotaKeluarga = () => {
    append({
      nik: "",
      nama: "",
      shdk: "",
    });
  };

  const removeAnggotaKeluarga = (index: number) => {
    if (fields.length > 1) {
      remove(index);
    }
  };

  const onSubmit = async (values: TCreatePermohonanPindahSchema) => {
    try {
      setIsLoading(true);
      const result = await createPermohonanPindahAction(values);

      if (result.status === 200) {
        toast.success(result.message);
        router.push(PATHS.PINDAH_REQUEST);
      } else {
        toast.error(result.message);
      }
    } catch (error) {
      toast.error("Terjadi kesalahan saat membuat permohonan pindah");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        {/* Jenis Permohonan */}
        <FormField
          control={form.control}
          name="jenisPermohonanPindah"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Jenis Permohonan Pindah</FormLabel>
              <Select onValueChange={field.onChange} defaultValue={field.value}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Pilih jenis permohonan" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  <SelectItem value="SKP">Surat Keterangan Pindah</SelectItem>
                  <SelectItem value="SKPLN">Surat Keterangan Pindah Luar Negeri</SelectItem>
                  <SelectItem value="SKTT">Surat Keterangan Tinggal Tetap</SelectItem>
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Data Pemohon */}
        <Card>
          <CardHeader>
            <CardTitle>Data Pemohon</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
            </div>
          </CardContent>
        </Card>

        {/* Data Asal */}
        <Card>
          <CardHeader>
            <CardTitle>Data Alamat Asal</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <FormField
              control={form.control}
              name="alamatAsal"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Alamat Lengkap</FormLabel>
                  <FormControl>
                    <Textarea placeholder="Masukkan alamat lengkap asal" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <FormField
                control={form.control}
                name="rtAsal"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>RT</FormLabel>
                    <FormControl>
                      <Input placeholder="RT" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="rwAsal"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>RW</FormLabel>
                    <FormControl>
                      <Input placeholder="RW" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="desaAsal"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Desa</FormLabel>
                    <FormControl>
                      <Input placeholder="Desa" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="kecamatanAsal"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Kecamatan</FormLabel>
                    <FormControl>
                      <Input placeholder="Kecamatan" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="kabupatenAsal"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Kabupaten</FormLabel>
                    <FormControl>
                      <Input placeholder="Kabupaten" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="provinsiAsal"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Provinsi</FormLabel>
                    <FormControl>
                      <Input placeholder="Provinsi" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
          </CardContent>
        </Card>

        {/* Data Kepindahan */}
        <Card>
          <CardHeader>
            <CardTitle>Data Kepindahan</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="klarifikasiKepindahan"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Klarifikasi Kepindahan</FormLabel>
                    <FormControl>
                      <Input placeholder="Klarifikasi kepindahan" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="jenisKepindahan"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Jenis Kepindahan</FormLabel>
                    <FormControl>
                      <Input placeholder="Jenis kepindahan" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            <FormField
              control={form.control}
              name="alasanPindah"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Alasan Pindah</FormLabel>
                  <FormControl>
                    <Textarea placeholder="Masukkan alasan pindah" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="anggotaKeluargaYangPindah"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Anggota Keluarga Yang Pindah</FormLabel>
                  <FormControl>
                    <Textarea placeholder="Deskripsi anggota keluarga yang pindah" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </CardContent>
        </Card>

        {/* Data Tujuan (untuk SKP) */}
        {jenisPermohonan === "SKP" && (
          <Card>
            <CardHeader>
              <CardTitle>Data Alamat Tujuan</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <FormField
                control={form.control}
                name="alamatTujuan"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Alamat Lengkap Tujuan</FormLabel>
                    <FormControl>
                      <Textarea placeholder="Masukkan alamat lengkap tujuan" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <FormField
                  control={form.control}
                  name="rtTujuan"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>RT</FormLabel>
                      <FormControl>
                        <Input placeholder="RT" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="rwTujuan"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>RW</FormLabel>
                      <FormControl>
                        <Input placeholder="RW" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="desaTujuan"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Desa</FormLabel>
                      <FormControl>
                        <Input placeholder="Desa" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="kecamatanTujuan"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Kecamatan</FormLabel>
                      <FormControl>
                        <Input placeholder="Kecamatan" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="kabupatenTujuan"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Kabupaten</FormLabel>
                      <FormControl>
                        <Input placeholder="Kabupaten" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="provinsiTujuan"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Provinsi</FormLabel>
                      <FormControl>
                        <Input placeholder="Provinsi" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </CardContent>
          </Card>
        )}

        {/* Data Sponsor (untuk SKTT) */}
        {jenisPermohonan === "SKTT" && (
          <Card>
            <CardHeader>
              <CardTitle>Data Sponsor</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="namaSponsor"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Nama Sponsor</FormLabel>
                      <FormControl>
                        <Input placeholder="Nama sponsor" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="tipeSponsor"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Tipe Sponsor</FormLabel>
                      <FormControl>
                        <Input placeholder="Tipe sponsor" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="noKitas"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Nomor KITAS</FormLabel>
                      <FormControl>
                        <Input placeholder="Nomor KITAS" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="tanggalKitas"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Tanggal KITAS</FormLabel>
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
                                format(field.value, "dd MMMM yyyy", { locale: id })
                              ) : (
                                <span>Pilih tanggal KITAS</span>
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
                            disabled={(date) => date > new Date()}
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
                name="alamatSponsor"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Alamat Sponsor</FormLabel>
                    <FormControl>
                      <Textarea placeholder="Alamat sponsor" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="negaraTujuan"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Negara Tujuan</FormLabel>
                      <FormControl>
                        <Input placeholder="Negara tujuan" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="penanggungJawab"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Penanggung Jawab</FormLabel>
                      <FormControl>
                        <Input placeholder="Penanggung jawab" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              <FormField
                control={form.control}
                name="alamatNegaraTujuan"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Alamat di Negara Tujuan</FormLabel>
                    <FormControl>
                      <Textarea placeholder="Alamat di negara tujuan" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="tanggalRencanaPindah"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Tanggal Rencana Pindah</FormLabel>
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
                              format(field.value, "dd MMMM yyyy", { locale: id })
                            ) : (
                              <span>Pilih tanggal rencana pindah</span>
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
                          disabled={(date) => date < new Date()}
                          initialFocus
                        />
                      </PopoverContent>
                    </Popover>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </CardContent>
          </Card>
        )}

        {/* Data Anggota Keluarga - Dynamic Fields */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle>Data Anggota Keluarga Yang Pindah</CardTitle>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={addAnggotaKeluarga}
            >
              <Plus className="h-4 w-4 mr-2" />
              Tambah Anggota
            </Button>
          </CardHeader>
          <CardContent className="space-y-4">
            {fields.map((field, index) => (
              <Card key={field.id} className="p-4">
                <div className="flex justify-between items-center mb-4">
                  <h4 className="text-sm font-medium">Anggota Keluarga {index + 1}</h4>
                  {fields.length > 1 && (
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => removeAnggotaKeluarga(index)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  )}
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <FormField
                    control={form.control}
                    name={`anggotaKeluarga.${index}.nik`}
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>NIK</FormLabel>
                        <FormControl>
                          <Input placeholder="NIK anggota keluarga" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name={`anggotaKeluarga.${index}.nama`}
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Nama Lengkap</FormLabel>
                        <FormControl>
                          <Input placeholder="Nama lengkap" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name={`anggotaKeluarga.${index}.shdk`}
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Status Hubungan Dalam Keluarga</FormLabel>
                        <FormControl>
                          <Input placeholder="Contoh: Kepala Keluarga, Istri, Anak" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </Card>
            ))}
          </CardContent>
        </Card>

        {/* Dokumen */}
        <Card>
          <CardHeader>
            <CardTitle>Dokumen Pendukung</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <FormField
              control={form.control}
              name="dokumenKK"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Dokumen KK (PDF)</FormLabel>
                  <FormControl>
                    <div className="relative">
                      <FileUploadField
                        value={field.value || ""}
                        onChange={field.onChange}
                        accept=".pdf"
                        placeholder="Klik untuk memilih dokumen KK (PDF)"
                        bucketName="docs"
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
            <FormField
              control={form.control}
              name="dokumenKTP"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Dokumen KTP (PDF)</FormLabel>
                  <FormControl>
                    <div className="relative">
                      <FileUploadField
                        value={field.value || ""}
                        onChange={field.onChange}
                        accept=".pdf"
                        placeholder="Klik untuk memilih dokumen KTP (PDF)"
                        bucketName="docs"
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
            <FormField
              control={form.control}
              name="dokumenSP"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Dokumen Surat Pengantar (PDF)</FormLabel>
                  <FormControl>
                    <div className="relative">
                      <FileUploadField
                        value={field.value || ""}
                        onChange={field.onChange}
                        accept=".pdf"
                        placeholder="Klik untuk memilih dokumen surat pengantar (PDF)"
                        bucketName="docs"
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
          </CardContent>
        </Card>

        {/* Catatan */}
        <FormField
          control={form.control}
          name="catatan"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Catatan (Opsional)</FormLabel>
              <FormControl>
                <Textarea placeholder="Catatan tambahan" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="flex gap-4">
          <Button
            type="button"
            variant="outline"
            onClick={() => router.back()}
            className="flex-1"
          >
            Batal
          </Button>
          <Button type="submit" disabled={isLoading} className="flex-1">
            {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Simpan Permohonan
          </Button>
        </div>
      </form>
    </Form>
  );
}
