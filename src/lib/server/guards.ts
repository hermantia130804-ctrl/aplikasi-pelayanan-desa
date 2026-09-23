import { findCurrentSessionService } from "@/lib/server/services/session";
import { redirect } from "next/navigation";
import { PATHS } from "@/constants/paths";

export const requireAdminPage = async () => {
  const session = await findCurrentSessionService();
  if (!session?.user) redirect(PATHS.SIGN_IN);
  if (session.user.role !== "ADMIN") redirect("/permohonan-saya");
  return session;
};
