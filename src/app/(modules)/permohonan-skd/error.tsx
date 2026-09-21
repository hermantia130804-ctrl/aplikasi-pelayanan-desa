"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { AlertTriangleIcon } from "lucide-react";
import { useEffect } from "react";

export default function PermohonanSKDErrorPage({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("PermohonanSKD error:", error);
  }, [error]);

  return (
<div className="flex flex-1 flex-col">
      <div className="@container/main flex flex-1 flex-col gap-2">
        <div className="flex flex-col gap-4 py-4 md:gap-6 md:py-6 px-4 lg:px-6">
          <Card>
            <CardContent className="flex flex-col items-center gap-4">
              <AlertTriangleIcon className="size-12 text-destructive" />
              <h1 className="text-xl font-bold">Gagal memuat data permohonan KTP</h1>
              <p>{error.message}</p>
              <Button onClick={() => reset()}>Coba lagi</Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
