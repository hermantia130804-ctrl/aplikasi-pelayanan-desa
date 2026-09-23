import { Role } from "@/generated/prisma";
import { IconChartBar, IconDashboard, IconListDetails, IconSettings2, IconUsers } from "@tabler/icons-react";
import { PATHS } from "./paths";

export const MENU = {
    MAIN: [
        {
            name: "Beranda",
            url: "/dashboard",
            icon: IconDashboard,
            roles: [Role.ADMIN, Role.USER]
        },
        {
            name: "Permohonan Saya",
            url: "/permohonan-saya",
            icon: IconListDetails,
            roles: [Role.ADMIN, Role.USER]
        },
    ],
    ADMIN: [
        {
            name: "Kelola Pengguna",
            url: PATHS.USER,
            icon: IconUsers,
            roles: [Role.ADMIN]
        },
        {
            name: "Kelola Permohonan KTP",
            url: PATHS.KTP_REQUEST,
            icon: IconListDetails,
            roles: [Role.ADMIN]
        },
        {
            name: "Kelola Permohonan KK",
            url: "/permohonan-kk",
            icon: IconChartBar,
            roles: [Role.ADMIN]
        },
        {
            name: "Kelola Permohonan SKL",
            url: PATHS.SKL_REQUEST,
            icon: IconChartBar,
            roles: [Role.ADMIN]
        },
        {
            name: "Kelola Permohonan SKTM",
            url: PATHS.SKTM_REQUEST,
            icon: IconChartBar,
            roles: [Role.ADMIN]
        },
        {
            name: "Kelola Permohonan SKK",
            url: PATHS.SKK_REQUEST,
            icon: IconChartBar,
            roles: [Role.ADMIN]
        },
        {
            name: "Kelola Permohonan SKU",
            url: PATHS.SKU_REQUEST,
            icon: IconChartBar,
            roles: [Role.ADMIN]
        },
        {
            name: "Kelola Permohonan SKD",
            url: PATHS.SKD_REQUEST,
            icon: IconChartBar,
            roles: [Role.ADMIN]
        },
    ],
    USER: [
        {
            name: "Ajukan KTP",
            url: "/permohonan-ktp-mandiri/tambah",
            icon: IconChartBar,
            roles: [Role.ADMIN, Role.USER]
        },
        {
            name: "Ajukan KK",
            url: "/permohonan-kk-mandiri/tambah",
            icon: IconChartBar,
            roles: [Role.ADMIN, Role.USER]
        },
        {
            name: "Ajukan SKL",
            url: "/permohonan-skl-mandiri/tambah",
            icon: IconChartBar,
            roles: [Role.ADMIN, Role.USER]
        },
        {
            name: "Ajukan SKTM",
            url: "/permohonan-sktm-mandiri/tambah",
            icon: IconChartBar,
            roles: [Role.ADMIN, Role.USER]
        },
        {
            name: "Ajukan SKK",
            url: "/permohonan-skk-mandiri/tambah",
            icon: IconChartBar,
            roles: [Role.ADMIN, Role.USER]
        },
        {
            name: "Ajukan SKU",
            url: "/permohonan-sku-mandiri/tambah",
            icon: IconChartBar,
            roles: [Role.ADMIN, Role.USER]
        },
        {
            name: "Ajukan SKD",
            url: "/permohonan-skd-mandiri/tambah",
            icon: IconChartBar,
            roles: [Role.ADMIN, Role.USER]
        },
    ],
    FOOTER: [
        {
            name: "Pengaturan",
            url: PATHS.SETTING,
            icon: IconSettings2,
            roles: [Role.ADMIN, Role.USER]
        },
    ]
}
