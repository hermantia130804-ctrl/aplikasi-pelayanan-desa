import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

import { PATHS } from "@/constants/paths";
import { IconLoader2 } from "@tabler/icons-react";
import Link from "next/link";

export default async function EmailVerificationLoading() {
  return (
    <Card>
      <CardHeader className="text-center">
        <CardTitle className="text-xl">Verifikasi Email</CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col items-center gap-6">
        <IconLoader2 className="animate-spin" />
        <p>Sedang memverifikasi email...</p>
        <Link href={PATHS.SIGN_IN} className="underline underline-offset-4">
          Kembali ke halaman masuk
        </Link>
      </CardContent>
    </Card>
  );
}
