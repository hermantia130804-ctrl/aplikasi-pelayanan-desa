"use client";

import { useIdleLogout } from "@/hooks/use-idle-logout";

export function IdleGuard() {
    useIdleLogout(true);
    return null;
}
