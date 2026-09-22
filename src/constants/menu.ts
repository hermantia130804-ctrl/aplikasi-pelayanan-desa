import { Role } from "@/generated/prisma";
import { IconChartBar, IconDashboard, IconListDetails, IconUsers } from "@tabler/icons-react";
import { PATHS } from "./paths";

export const MENU = {
    MAIN: [
        {
            name: "Beranda",
            url: PATHS.HOME,
            icon: IconDashboard,
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
    USER: [],
    FOOTER: []
}
