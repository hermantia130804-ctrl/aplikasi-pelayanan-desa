
import { EmailVerificationForm } from "@/components/email-verification-form";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Verifikasi Email | Aplikasi Pelayanan Desa Sukamaju",
  description: "Verifikasi Email - Aplikasi Pelayanan Desa Sukamaju",
};

export default function EmailVerificationPage() {
  return <EmailVerificationForm />
}
