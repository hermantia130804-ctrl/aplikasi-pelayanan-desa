import { Role } from "@/generated/prisma";
import { IconChartBar, IconDashboard, IconListDetails, IconSettings2, IconUsers } from "@tabler/icons-react";
import { IconNews } from "@tabler/icons-react";
import { PATHS } from "./paths";

const A = [Role.ADMIN];
const P = [Role.PETUGAS];
const U = [Role.USER];
const AP = [Role.ADMIN, Role.PETUGAS];
const AU = [Role.ADMIN, Role.USER];
const PU = [Role.PETUGAS, Role.USER];
const ALL = [Role.ADMIN, Role.PETUGAS, Role.USER];

export const MENU = {
    MAIN: [
        { name: "Beranda", url: "/dashboard", icon: IconDashboard, roles: ALL },
        { name: "Permohonan Saya", url: "/permohonan-saya", icon: IconListDetails, roles: U },
    ],
    ADMIN: [
        { name: "Kelola Pengguna", url: PATHS.USER, icon: IconUsers, roles: A },
        { name: "Kelola Permohonan KTP", url: PATHS.KTP_REQUEST, icon: IconListDetails, roles: AP },
        { name: "Kelola Permohonan KK", url: "/permohonan-kk", icon: IconChartBar, roles: AP },
        { name: "Kelola Permohonan SKL", url: PATHS.SKL_REQUEST, icon: IconChartBar, roles: AP },
        { name: "Kelola Permohonan SKTM", url: PATHS.SKTM_REQUEST, icon: IconChartBar, roles: AP },
        { name: "Kelola Permohonan SKK", url: PATHS.SKK_REQUEST, icon: IconChartBar, roles: AP },
        { name: "Kelola Permohonan SKU", url: PATHS.SKU_REQUEST, icon: IconChartBar, roles: AP },
        { name: "Kelola Permohonan SKD", url: PATHS.SKD_REQUEST, icon: IconChartBar, roles: AP },
        { name: "Kegiatan Desa", url: "/berita-kegiatan", icon: IconNews, roles: AP },

    ],
    USER: [
        { name: "Ajukan KTP", url: "/permohonan-ktp-mandiri/tambah", icon: IconChartBar, roles: U },
        { name: "Ajukan KK", url: "/permohonan-kk-mandiri/tambah", icon: IconChartBar, roles: U },
        { name: "Ajukan SKL", url: "/permohonan-skl-mandiri/tambah", icon: IconChartBar, roles: U },
        { name: "Ajukan SKTM", url: "/permohonan-sktm-mandiri/tambah", icon: IconChartBar, roles: U },
        { name: "Ajukan SKK", url: "/permohonan-skk-mandiri/tambah", icon: IconChartBar, roles: U },
        { name: "Ajukan SKU", url: "/permohonan-sku-mandiri/tambah", icon: IconChartBar, roles: U },
        { name: "Ajukan SKD", url: "/permohonan-skd-mandiri/tambah", icon: IconChartBar, roles: U },
    ],
    FOOTER: [
        { name: "Pengaturan", url: PATHS.SETTING, icon: IconSettings2, roles: ALL },
    ]
}
