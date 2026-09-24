"use client"

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { PATHS } from "@/constants/paths";
import { signInAction } from "@/lib/server/actions/auth";
import { cn } from "@/lib/utils";
import { signInSchema, TSignInSchema } from "@/lib/validators/auth";
import { zodResolver } from "@hookform/resolvers/zod";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "./ui/form";

export const SignInForm = ({
  className,
  ...props
}: React.ComponentProps<"form">) => {

  const router = useRouter();

  const form = useForm<TSignInSchema>({
    resolver: zodResolver(signInSchema),
    defaultValues: {
      email: "",
      password: "",
    },
  });

  const onSubmit = form.handleSubmit(async (data) => {
    try {
      console.log(data);
      const response = await signInAction(data);
      if (response.status === 200) {
        form.reset();
        toast.success(response.message);
        router.push("/dashboard");
      }
      else toast.error(response.message);
    } catch (error) {
      if (error instanceof Error) {
        return toast.error("Terjadi kesalahan pada server.");
      }
    }
  });

  return (
    <Form {...form}>
      <form
        onSubmit={onSubmit}
        className={cn("flex flex-col gap-6", className)}
        {...props}
      >
        <div className="flex flex-col items-center gap-2 text-center">
          <h1 className="text-2xl font-bold">Masuk</h1>
          <p className="text-muted-foreground text-sm text-balance">
            Silahkan login untuk masuk ke dalam sistem
          </p>
        </div>
        <div className="grid gap-6">
          <FormField
            control={form.control}
            name="email"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Email</FormLabel>
                <FormControl>
                  <Input placeholder="contoh@email.com" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="password"
            render={({ field }) => (
              <FormItem>
                <div className="flex items-center">
                  <FormLabel>Password</FormLabel>
                  <Link
                    href={PATHS.FORGOT_PASSWORD}
                    className="ml-auto text-sm underline-offset-2 hover:underline"
                  >
                    Lupa Password?
                  </Link>
                </div>
                <FormControl>
                  <Input type="password" placeholder="kata sandi" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <Button type="submit" className="w-full">
            Masuk
          </Button>
        </div>
        <div className="text-center text-sm">
          Belum Punya Akun?{" "}
          <Link href={PATHS.SIGN_UP} className="underline underline-offset-4">
            Daftar
          </Link>
        </div>
        <div className="text-center text-sm">
          Belum Verifikasi Email?{" "}
          <Link href={PATHS.EMAIL_VERIFICATION} className="underline underline-offset-4">
            Verifikasi
          </Link>
        </div>
        <p className="mt-1 animate-pulse text-center text-sm font-bold text-red-600">
         Periksa Balasan Email di Inbox/Spam
        </p>
      </form>
    </Form>
  );
};
