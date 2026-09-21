import { ModeToggle } from "@/components/mode-toggle";
import { SignUpForm } from "@/components/sign-up-form";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Daftar | Aplikasi Pelayanan Desa Sukamaju",
  description: "Daftar - Aplikasi Pelayanan Desa Sukamaju",
};

export default function SignUpPage() {
  return (
    <div className="bg-background flex min-h-svh flex-col items-center justify-center gap-6 p-6 md:p-10">
      <div className="w-full max-w-sm">
        <SignUpForm />
      </div>
      <div className="absolute z-50 top-5 right-5">
        <ModeToggle />
      </div>
    </div>
  );
}
