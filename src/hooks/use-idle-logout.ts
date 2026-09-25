"use client";

import { useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

const IDLE_MS = 10 * 60 * 1000; // 10 menit
const EVENTS = ["mousemove", "mousedown", "keydown", "scroll", "touchstart", "click"];

export function useIdleLogout(enabled: boolean) {
    const router = useRouter();
    const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
    const warningRef = useRef<ReturnType<typeof setTimeout> | null>(null);

    useEffect(() => {
        if (!enabled) return;

        let isLoggingOut = false;

        const resetTimer = () => {
            if (isLoggingOut) return;
            if (timerRef.current) clearTimeout(timerRef.current);
            if (warningRef.current) clearTimeout(warningRef.current);

            timerRef.current = setTimeout(async () => {
                isLoggingOut = true;
                try {
                    const { signOutAction } = await import("@/lib/server/actions/auth");
                    await signOutAction();
                    toast.info("Anda keluar otomatis karena tidak ada aktivitas selama 10 menit.");
                    router.push("/");
                    router.refresh();
                } catch {
                    router.push("/");
                }
            }, IDLE_MS);

            // Peringatan 1 menit sebelum logout
            warningRef.current = setTimeout(() => {
                if (!isLoggingOut) {
                    toast.warning("Anda akan keluar otomatis dalam 1 menit karena tidak ada aktivitas.");
                }
            }, IDLE_MS - 60 * 1000);
        };

        resetTimer();
        EVENTS.forEach((e) => window.addEventListener(e, resetTimer, { passive: true }));

        return () => {
            if (timerRef.current) clearTimeout(timerRef.current);
            if (warningRef.current) clearTimeout(warningRef.current);
            EVENTS.forEach((e) => window.removeEventListener(e, resetTimer));
        };
    }, [enabled, router]);
}
