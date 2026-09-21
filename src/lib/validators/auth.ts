import { z } from "zod";
import { VALIDATION_MESSAGE } from "@/constants/validation-message";

export const signInSchema = z.object({
  email: z.string().email(VALIDATION_MESSAGE.INVALID_EMAIL),
  password: z.string().min(8, VALIDATION_MESSAGE.INVALID_PASSWORD),
});

export const signUpSchema = z.object({
  nik: z.string().min(16, VALIDATION_MESSAGE.INVALID_NIK),
  name: z.string().min(3, VALIDATION_MESSAGE.INVALID_NAME),
  email: z.string().email(VALIDATION_MESSAGE.INVALID_EMAIL),
  password: z.string().min(8, VALIDATION_MESSAGE.INVALID_PASSWORD),
  address: z.string().min(3, VALIDATION_MESSAGE.INVALID_ADDRESS).optional(),
  phone: z.string().min(10, VALIDATION_MESSAGE.INVALID_PHONE).optional(),
});

export const forgotPasswordSchema = z.object({
  email: z.string().email(VALIDATION_MESSAGE.INVALID_EMAIL),
});

export const emailVerificationSchema = z.object({
  email: z.string().email(VALIDATION_MESSAGE.INVALID_EMAIL),
});

export const resetPasswordSchema = z.object({
  forgotPasswordId: z.string(),
  password: z.string().min(8, VALIDATION_MESSAGE.INVALID_PASSWORD),
});

export type TSignInSchema = z.infer<typeof signInSchema>;
export type TSignUpSchema = z.infer<typeof signUpSchema>;
export type TForgotPasswordSchema = z.infer<typeof forgotPasswordSchema>;
export type TEmailVerificationSchema = z.infer<typeof emailVerificationSchema>;
export type TResetPasswordSchema = z.infer<typeof resetPasswordSchema>;
