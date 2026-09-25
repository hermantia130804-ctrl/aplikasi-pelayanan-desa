"use client"

import { PATHS } from "@/constants/paths";
import { User } from "@/generated/prisma";
import { updateUserAction } from "@/lib/server/actions/user";
import { cn } from "@/lib/utils";
import { TUpdateUserSchema, updateUserSchema } from "@/lib/validators/user";
import { zodResolver } from "@hookform/resolvers/zod";
import { Crown, UserCog2Icon, UserIcon } from "lucide-react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "./ui/form";
import { Input } from "./ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./ui/select";
import { Textarea } from "./ui/textarea";
type UserDetailFormProps = {
    data: Omit<User, "password" | "createdAt" | "updatedAt">;
} & React.HTMLAttributes<HTMLDivElement>;

export const UserDetailForm = ({ data: initialData, className, ...props }: UserDetailFormProps) => {
    const router = useRouter();
    const form = useForm<TUpdateUserSchema>({
        resolver: zodResolver(updateUserSchema),
        defaultValues: {
            email: initialData.email,
            address: initialData.address ?? "",
            phone: initialData.phone ?? "",
            name: initialData.name,
            nik: initialData.nik,
            role: initialData.role,
        },
    });

    const onSubmit = form.handleSubmit(async (data) => {
        try {
            const response = await updateUserAction(initialData.userId, data);
            if (response.status === 200) {
                form.reset();
                toast.success(response.message);
                router.push(PATHS.USER);
            }
            else toast.error(response.message);
        } catch (error) {
            if (error instanceof Error) {
                return toast.error("Terjadi kesalahan pada server.");
            }
        }
    });

    return (
        <div className="flex flex-col gap-6">
            <Card>
                <CardHeader>
                    <CardTitle>Detail Pengguna</CardTitle>
                </CardHeader>
                <CardContent>
                    <div className={cn("flex flex-col gap-6", className)} {...props}>
                        <Form {...form}>
                            <form onSubmit={onSubmit}>
                                <div className="flex flex-col gap-6">
                                    <FormField
                                        control={form.control}
                                        name="name"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>Nama</FormLabel>
                                                <FormControl>
                                                    <Input disabled placeholder="Nama Lengkap" {...field} />
                                                </FormControl>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />
                                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                                        <FormField
                                            control={form.control}
                                            name="nik"
                                            render={({ field }) => (
                                                <FormItem>
                                                    <FormLabel>NIK</FormLabel>
                                                    <FormControl>
                                                        <Input disabled placeholder="3207040101010001" {...field} />
                                                    </FormControl>
                                                    <FormMessage />
                                                </FormItem>
                                            )}
                                        />
                                        <FormField
                                            control={form.control}
                                            name="email"
                                            render={({ field }) => (
                                                <FormItem>
                                                    <FormLabel>Email</FormLabel>
                                                    <FormControl>
                                                        <Input disabled placeholder="contoh@email.com" {...field} />
                                                    </FormControl>
                                                    <FormMessage />
                                                </FormItem>
                                            )}
                                        />
                                    </div>
                                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                                        <FormField
                                            control={form.control}
                                            name="role"
                                            render={({ field }) => (
                                                <FormItem>
                                                    <FormLabel>Peran</FormLabel>
                                                    <Select disabled onValueChange={field.onChange} defaultValue={field.value}>
                                                        <FormControl>
                                                            <SelectTrigger className="w-full">
                                                                <SelectValue placeholder="Pilih Peran" />
                                                            </SelectTrigger>
                                                        </FormControl>
                                                        <SelectContent>
                                                            <SelectItem value="ADMIN"><Crown className="mr-2" /> Admin Full Control</SelectItem>
                                                            <SelectItem value="PETUGAS"><UserCog2Icon className="mr-2" /> Petugas</SelectItem>
                                                            <SelectItem value="USER"><UserIcon className="mr-2" /> Masyarakat</SelectItem>
                                                        </SelectContent>
                                                    </Select>
                                                    <FormMessage />
                                                </FormItem>
                                            )}
                                        />
                                        <FormField
                                            control={form.control}
                                            name="phone"
                                            render={({ field }) => (
                                                <FormItem>
                                                    <FormLabel>Nomor Telepon</FormLabel>
                                                    <FormControl>
                                                        <Input disabled placeholder="08XX-XXXX-XXXX" {...field} />
                                                    </FormControl>
                                                    <FormMessage />
                                                </FormItem>
                                            )}
                                        />
                                    </div>
                                    <FormField
                                        control={form.control}
                                        name="address"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>Alamat</FormLabel>
                                                <FormControl>
                                                    <Textarea disabled placeholder="Nomor Rumah, RT/RW" {...field} />
                                                </FormControl>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />
                                </div>
                            </form>
                        </Form>
                    </div>
                </CardContent>
            </Card>
            <Card>
                <CardHeader>
                    <CardTitle>Pengajuan Dokumen</CardTitle>
                </CardHeader>
            </Card>
        </div>
    )

}