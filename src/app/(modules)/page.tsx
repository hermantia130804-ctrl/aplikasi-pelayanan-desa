import { DashboardCards } from "@/components/dashboard-cards";
import { DashboardCharts } from "@/components/dashboard-charts";
import { DashboardDataTable } from "@/components/dashboard-data-table";

import { Metadata } from "next";
import data from "./data.json";

export const metadata: Metadata = {
  title: "Beranda | Aplikasi Pelayanan Desa Sukamaju",
  description: "Beranda - Aplikasi Pelayanan Desa Sukamaju",
};

export default function DashboardPage() {
  return (
    <div className="flex flex-1 flex-col">
      <div className="@container/main flex flex-1 flex-col gap-2">
        <div className="flex flex-col gap-4 py-4 md:gap-6 md:py-6">
          <DashboardCards />
          <div className="px-4 lg:px-6">
            <DashboardCharts />
          </div>
          <DashboardDataTable data={data} />
        </div>
      </div>
    </div>
  );
}
