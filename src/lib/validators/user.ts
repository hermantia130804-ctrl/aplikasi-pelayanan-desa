import { VALIDATION_MESSAGE as MESSAGE } from "@/constants/validation-message";
import { z } from "zod";
import { findManySchema } from "./base";


// FIND SCHEMA

export const findManyUserSchema = findManySchema.extend({
  role: z.enum(["ADMIN", "USER"]).optional(),
  status: z.enum(["ACTIVE", "INACTIVE"]).optional(),
  searchBy: z.enum(["nik", "name", "address", "phone", "email"]).optional().default("name"),
  orderby: z.enum(["nik", "name", "address", "phone", "email", "createdAt", "updatedAt"]).optional().default("createdAt"),
})

// CREATE SCHEMA

export const createUserSchema = z.object({
  email: z.string().email(MESSAGE.INVALID_EMAIL),
  nik: z.string().min(16, MESSAGE.INVALID_NIK),
  name: z.string().min(3, MESSAGE.INVALID_NAME),
  role: z.enum(["ADMIN", "USER"]),
  address: z.string().optional(),
  phone: z.string().optional(),
  password: z.string().min(8, MESSAGE.INVALID_PASSWORD).max(255),
});


// UPDATE SCHEMA

export const updateUserSchema = z.object({
  email: z.string().email(MESSAGE.INVALID_EMAIL).optional(),
  nik: z.string().optional(),
  name: z.string().optional(),
  address: z.string().optional(),
  phone: z.string().optional(),
  role: z.enum(["ADMIN", "USER"]).optional(),
});

export const updateUserPasswordSchema = z.object({
  password: z.string().min(8, MESSAGE.INVALID_PASSWORD).max(255),
});

// TYPE

export type TCreateUserSchema = z.infer<typeof createUserSchema>;
export type TUpdateUserSchema = z.infer<typeof updateUserSchema>;
export type TUpdateUserPasswordSchema = z.infer<typeof updateUserPasswordSchema>;
export type TFindManyUserSchema = z.infer<typeof findManyUserSchema>;
