import { findCurrentSessionService } from "@/lib/server/services/session";
import { redirect } from "next/navigation";
import CekBansosClient from "./page-client";

export const dynamic = "force-dynamic";

export default async function CekBansosPage() {
  const session = await findCurrentSessionService();
  if (!session?.user) redirect("/masuk");

  return (
    <CekBansosClient
      nama={session.user.name}
      nik={session.user.nik}
      detailBansos={session.user.detailBansos}
    />
  );
}
