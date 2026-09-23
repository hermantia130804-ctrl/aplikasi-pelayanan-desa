import { GalleryVerticalEnd } from "lucide-react"

import { SignInForm } from "@/components/sign-in-form"
import Image from "next/image"
import { ModeToggle } from "@/components/mode-toggle"
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Masuk | Aplikasi Pelayanan Desa Sukamaju",
  description: "Masuk - Aplikasi Pelayanan Desa Sukamaju",
};

export default function LoginPage() {
  return (
    <div className="grid min-h-svh lg:grid-cols-2">
      <div className="absolute z-50 top-5 right-5">
        <ModeToggle/>
      </div>
      <div className="flex flex-col gap-4 p-6 md:p-10">
        <div className="flex justify-center gap-2 md:justify-start">
          <a href="#" className="flex items-center gap-2 font-medium">
            <div className="bg-primary text-primary-foreground flex size-6 items-center justify-center rounded-md">
              <img src="/logo-kab-bogor.png" alt="Logo Kab. Bogor" className="size-6 object-contain" />
            </div>
            Desa Sukamaju
          </a>
        </div>
        <div className="flex flex-1 items-center justify-center">
          <div className="w-full max-w-xs">
            <SignInForm />
          </div>
        </div>
      </div>
      <div className="bg-muted relative hidden lg:block">
        <Image
          src="/login-desk.jpg"
          alt="Image"
          fill
          className="absolute inset-0 h-full w-full object-cover dark:brightness-[0.2] dark:grayscale"
        />
      </div>
    </div>
  )
}
