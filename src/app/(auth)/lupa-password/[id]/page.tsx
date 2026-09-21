import { GalleryVerticalEnd } from "lucide-react"

import { ResetPasswordForm } from "@/components/reset-password-form"
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Reset Password | Aplikasi Pelayanan Desa Sukamaju",
  description: "Reset Password - Aplikasi Pelayanan Desa Sukamaju",
};

interface ResetPasswordPageProps {
  params: Promise<{ id: string }>
}

export default async function ResetPasswordPage({ params }: ResetPasswordPageProps) {
  const { id } = await params
  return (
    <div className="bg-muted flex min-h-svh flex-col items-center justify-center gap-6 p-6 md:p-10">
      <div className="flex w-full max-w-sm flex-col gap-6">
        <a href="#" className="flex items-center gap-2 self-center font-medium">
          <div className="bg-primary text-primary-foreground flex size-6 items-center justify-center rounded-md">
            <GalleryVerticalEnd className="size-4" />
          </div>
          Desa Sukamaju
        </a>
        <ResetPasswordForm forgotPasswordId={id}/>
      </div>
    </div>
  )
}
