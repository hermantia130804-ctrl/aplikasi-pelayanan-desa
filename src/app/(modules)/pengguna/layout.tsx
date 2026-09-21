import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Kelola Pengguna",
  description: "Kelola Pengguna - Aplikasi Pelayanan Desa Sukamaju",
};

export default function UserLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    children
  );
}
