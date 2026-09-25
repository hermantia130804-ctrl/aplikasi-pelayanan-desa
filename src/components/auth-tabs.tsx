"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { SignInForm } from "@/components/sign-in-form";
import { SignUpForm } from "@/components/sign-up-form";

type AuthTabsProps = {
    initialTab?: "masuk" | "daftar";
};

export function AuthTabs({ initialTab = "masuk" }: AuthTabsProps) {
    const [tab, setTab] = useState<"masuk" | "daftar">(initialTab);

    return (
        <div className="w-full">
            <div className="mb-6 grid grid-cols-2 gap-2">
                <Button
                    variant={tab === "masuk" ? "default" : "outline"}
                    onClick={() => setTab("masuk")}
                >
                    Masuk
                </Button>
                <Button
                    variant={tab === "daftar" ? "default" : "outline"}
                    onClick={() => setTab("daftar")}
                >
                    Daftar
                </Button>
            </div>
            {tab === "masuk" ? <SignInForm /> : <SignUpForm />}
        </div>
    );
}
