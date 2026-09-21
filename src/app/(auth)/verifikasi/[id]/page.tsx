import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { CheckCircle2Icon } from "lucide-react";

import { PATHS } from "@/constants/paths";
import Link from "next/link";
import { validateEmailVerificationAction } from "@/lib/server/actions/auth";

interface EmailVerificationPageProps {
  params: Promise<{ id: string }>;
}

export default async function EmailVerificationPage({
  params,
}: EmailVerificationPageProps) {
  const { id } = await params;
  const { status, message } = await validateEmailVerificationAction(id);
  return (
    <Card>
      <CardHeader className="text-center">
        <CardTitle className="text-xl">Verifikasi Email</CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col items-center gap-6">
        {status === 200 ? (
          <Alert>
            <CheckCircle2Icon />
            <AlertTitle>Verifikasi email berhasil</AlertTitle>
            <AlertDescription>{message}</AlertDescription>
          </Alert>
        ) : (
          <Alert variant="destructive">
            <CheckCircle2Icon />
            <AlertTitle>Terjadi kesalahan pada server</AlertTitle>
            <AlertDescription>{message}</AlertDescription>
          </Alert>
        )}
        <Link href={PATHS.SIGN_IN} className="underline underline-offset-4">
          Kembali ke halaman masuk
        </Link>
      </CardContent>
    </Card>
  );
}
