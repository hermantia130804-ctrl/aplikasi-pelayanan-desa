import { Card, CardContent } from "@/components/ui/card";

interface WelcomeBansosCardProps {
  nama: string;
  nik: string;
  detailBansos?: string | null;
}

// Kartu display-only: detail bansos sudah di-fetch otomatis saat login (signInAction ->
// fetchDetailBansosByNik -> User.detailBansos). Tidak ada tombol — tampil apa adanya.
export function WelcomeBansosCard({ nama, nik, detailBansos }: WelcomeBansosCardProps) {
  return (
    <Card className="border-emerald-200 bg-gradient-to-b from-emerald-50/50 to-white">
      <CardContent className="p-6">
        <p className="text-center text-sm font-medium text-emerald-600 uppercase tracking-wide">
          Selamat Datang
        </p>
        <h2 className="text-center text-2xl font-bold text-gray-900 mt-1">{nama}</h2>
        <p className="text-center text-sm text-muted-foreground mt-1">NIK: {nik}</p>

        <div className="mt-4 border-t border-emerald-100 pt-4">
          <p className="text-center text-sm font-semibold text-gray-700 mb-2">Detail Bansos</p>
          {detailBansos ? (
            <div className="whitespace-pre-line text-sm text-gray-600 bg-gray-50 rounded-lg p-3 max-w-md mx-auto">
              {detailBansos}
            </div>
          ) : (
            <p className="text-center text-sm text-muted-foreground max-w-md mx-auto">
              Detail bansos akan diambil otomatis dari Kemensos (MINSOS) saat Anda masuk.
            </p>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
