"use client";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PATHS } from "@/constants/paths";
import { CheckCircle2Icon } from "lucide-react";
import Link from "next/link";

export default function EmailVerificationError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <Card>
      <CardHeader className="text-center">
        <CardTitle className="text-xl">Verifikasi Email</CardTitle>
      </CardHeader>
      <CardContent>
        <Alert variant="destructive">
          <CheckCircle2Icon />
          <AlertTitle>Terjadi kesalahan pada server</AlertTitle>
          <AlertDescription>{error.message}</AlertDescription>
        </Alert>
        <div className="flex flex-col gap-4">
          <Button onClick={() => reset()} className="mt-4">
            Coba lagi
          </Button>
          <Link href={PATHS.SIGN_IN} className="underline underline-offset-4">
            Kembali ke halaman masuk
          </Link>
        </div>
      </CardContent>
    </Card>
  );
}
