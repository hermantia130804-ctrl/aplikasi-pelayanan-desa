"use client";

import { Eye, EyeOff } from "lucide-react";
import * as React from "react";
import { Input } from "@/components/ui/input";

type PasswordInputProps = React.ComponentProps<"input"> & {
    placeholder?: string;
};

export const PasswordInput = React.forwardRef<HTMLInputElement, PasswordInputProps>(
    ({ placeholder = "••••••••", className, ...props }, ref) => {
        const [visible, setVisible] = React.useState(false);

        return (
            <div className="relative">
                <Input
                    type={visible ? "text" : "password"}
                    placeholder={placeholder}
                    className="pr-10"
                    ref={ref}
                    {...props}
                />
                <button
                    type="button"
                    onClick={() => setVisible((v) => !v)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                    tabIndex={-1}
                    aria-label={visible ? "Sembunyikan password" : "Tampilkan password"}
                >
                    {visible ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                </button>
            </div>
        );
    }
);
PasswordInput.displayName = "PasswordInput";
