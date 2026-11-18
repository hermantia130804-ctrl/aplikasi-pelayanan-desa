"use client";

import { useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

const IDLE_MS = 10 * 60 * 1000; // 10 menit
const WARNING_BEFORE_MS = 60 * 1000; // peringatan 1 menit sebelum logout
const CHECK_INTERVAL_MS = 30 * 1000; // cek tiap 30 detik (robust terhadap mobile throttling)

// Event yang menandakan user aktif. touchmove ditambahkan khusus mobile
// (mousemove tidak fire di HP). visibilitychange untuk deteksi user kembali
// ke tab setelah pindah app.
const EVENTS = [
    "mousemove",
    "mousedown",
    "keydown",
    "scroll",
    "touchstart",
    "touchmove",
    "touchend",
    "click",
];

export function useIdleLogout(enabled: boolean) {
    const router = useRouter();
    const lastActivityRef = useRef<number>(Date.now());
    const isLoggingOutRef = useRef(false);
    const warningShownRef = useRef(false);

    useEffect(() => {
        if (!enabled) return;

        // Reset timestamp aktivitas terakhir
        const markActive = () => {
            if (isLoggingOutRef.current) return;
            lastActivityRef.current = Date.now();
            warningShownRef.current = false;
        };

        // Pasang listener event
        EVENTS.forEach((e) => {
            window.addEventListener(e, markActive, { passive: true });
        });

        // Saat tab visible lagi (user balik dari app lain), cek idle
        const onVisibility = () => {
            if (document.visibilityState === "visible") {
                markActive();
                checkIdle();
            }
        };
        document.addEventListener("visibilitychange", onVisibility);

        // Interval check: tiap 30 detik, bandingkan lastActivity dengan now.
        // Mobile browser throttle setTimeout saat background, tapi setInterval
        // tetap jalan (atau di-resume saat tab visible lagi + visibilitychange
        // handler langsung cek).
        const checkIdle = async () => {
            if (isLoggingOutRef.current) return;
            const now = Date.now();
            const idleFor = now - lastActivityRef.current;

            // Peringatan 1 menit sebelum logout (cuma sekali)
            if (
                idleFor >= IDLE_MS - WARNING_BEFORE_MS &&
                idleFor < IDLE_MS &&
                !warningShownRef.current
            ) {
                warningShownRef.current = true;
                toast.warning(
                    "Anda akan keluar otomatis dalam 1 menit karena tidak ada aktivitas. Klik di mana saja untuk memperpanjang sesi."
                );
            }

            // Idle lebih dari 10 menit -> logout
            if (idleFor >= IDLE_MS) {
                isLoggingOutRef.current = true;
                try {
                    const { signOutAction } = await import("@/lib/server/actions/auth");
                    await signOutAction();
                    toast.info("Anda keluar otomatis karena tidak ada aktivitas selama 10 menit.");
                    router.push("/");
                    router.refresh();
                } catch {
                    router.push("/");
                }
            }
        };

        const intervalId = window.setInterval(checkIdle, CHECK_INTERVAL_MS);

        return () => {
            window.clearInterval(intervalId);
            EVENTS.forEach((e) => window.removeEventListener(e, markActive));
            document.removeEventListener("visibilitychange", onVisibility);
        };
    }, [enabled, router]);
}
