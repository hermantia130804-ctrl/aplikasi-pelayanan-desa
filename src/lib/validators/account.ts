import { z } from "zod";
import { VALIDATION_MESSAGE } from "@/constants/validation-message";

export const changePasswordSchema = z.object({
    password: z.string().min(8, VALIDATION_MESSAGE.INVALID_PASSWORD),
    newPassword: z.string().min(8, VALIDATION_MESSAGE.INVALID_PASSWORD),
});

export type TChangePasswordSchema = z.infer<typeof changePasswordSchema>;