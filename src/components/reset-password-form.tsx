"use client"

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { PATHS } from "@/constants/paths";
import { resetPasswordAction } from "@/lib/server/actions/auth";
import { cn } from "@/lib/utils";
import {
  resetPasswordSchema,
  TResetPasswordSchema
} from "@/lib/validators/auth";
import { zodResolver } from "@hookform/resolvers/zod";
import Link from "next/link";
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
import { useRouter } from "next/navigation";

type ResetPasswordFormProps = {
  forgotPasswordId: string;
} & React.ComponentProps<"div">

export const ResetPasswordForm = ({
  forgotPasswordId,
  className,
  ...props
}: ResetPasswordFormProps) => {

  const router = useRouter();

  const form = useForm<TResetPasswordSchema>({
    resolver: zodResolver(resetPasswordSchema),
    defaultValues: {
      forgotPasswordId,
      password: "",
    },
  });

  const onSubmit = form.handleSubmit(async (data) => {
    try {
      console.log(data);
      const response = await resetPasswordAction(data);
      if (response.status === 200) {
        form.reset();
        toast.success(response.message);
        router.push(PATHS.SIGN_IN);
      }
      else toast.error(response.message);
    } catch (error) {
      if (error instanceof Error) {
        return toast.error("Terjadi kesalahan pada server.");
      }
    }
  });

  return (
    <div className={cn("flex flex-col gap-6", className)} {...props}>
      <Card>
        <CardHeader className="text-center">
          <CardTitle className="text-xl">Reset Password</CardTitle>
          <CardDescription>
            Reset password Anda
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={onSubmit}>
              <div className="grid gap-6">
                <div className="grid gap-6">
                  <FormField
                    control={form.control}
                    name="password"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Password</FormLabel>
                        <FormControl>
                          <Input type="password" placeholder="Masukkan password" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <Button type="submit" className="w-full">
                    Reset
                  </Button>
                </div>
                <div className="text-center text-sm">
                  <Link
                    href={PATHS.SIGN_IN}
                    className="underline underline-offset-4"
                  >
                    Masuk
                  </Link>
                </div>
              </div>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  );
};
