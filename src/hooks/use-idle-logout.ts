"use client";

import { useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

const IDLE_MS = 10 * 60 * 1000; // 10 menit
const WARNING_BEFORE_MS = 60 * 1000; // peringatan 1 menit sebelum logout
const CHECK_INTERVAL_MS = 10 * 1000; // cek tiap 10 detik (lebih responsif di mobile)

// Event yang menandakan user aktif.
// touchstart/touchmove/touchend khusus mobile (mousemove tidak fire di HP).
const EVENTS = [
    "mousemove",
    "mousedown",
    "keydown",
    "scroll",
    "touchstart",
    "touchmove",
    "touchend",
    "click",
    "wheel",
    "pointerdown",
];

export function useIdleLogout(enabled: boolean) {
    const router = useRouter();
    const lastActivityRef = useRef<number>(Date.now());
    const isLoggingOutRef = useRef(false);
    const warningShownRef = useRef(false);

    useEffect(() => {
        if (!enabled) return;

        // Reset timestamp aktivitas terakhir (dipanggil oleh event user interaction)
        const markActive = () => {
            if (isLoggingOutRef.current) return;
            lastActivityRef.current = Date.now();
            warningShownRef.current = false;
        };

        // Cek apakah user sudah idle lebih dari 10 menit
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
                    // Fallback: redirect langsung ke login
                    window.location.href = "/masuk";
                }
            }
        };

        // Pasang listener event user interaction
        EVENTS.forEach((e) => {
            window.addEventListener(e, markActive, { passive: true });
        });

        // BUG FIX: Saat tab visible lagi (user balik dari app lain / unlock HP),
        // JANGAN reset lastActivity. Cukup cek idle — kalau sudah > 10 menit, logout.
        // (Sebelumnya markActive() dipanggil di sini, yang reset timer dan
        //  membuat logout tidak pernah fire saat user balik dari background.)
        const onVisibility = () => {
            if (document.visibilityState === "visible") {
                checkIdle();
            }
        };
        document.addEventListener("visibilitychange", onVisibility);

        // Backup: window focus (untuk browser yang tidak fire visibilitychange
        // saat user balik dari app lain di HP)
        window.addEventListener("focus", checkIdle);

        // Backup: pageshow (untuk bfcache restoration di mobile Safari/Chrome)
        window.addEventListener("pageshow", (e) => {
            if (e.persisted) {
                // Page restored from bfcache — cek idle
                checkIdle();
            }
        });

        // Interval check: tiap 10 detik
        // Mobile browser throttle setInterval saat background, tapi
        // visibilitychange + focus handler akan catch up saat user balik.
        const intervalId = window.setInterval(checkIdle, CHECK_INTERVAL_MS);

        return () => {
            window.clearInterval(intervalId);
            EVENTS.forEach((e) => window.removeEventListener(e, markActive));
            document.removeEventListener("visibilitychange", onVisibility);
            window.removeEventListener("focus", checkIdle);
        };
    }, [enabled, router]);
}
