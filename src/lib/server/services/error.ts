import { PrismaClientKnownRequestError } from "@prisma/client/runtime/library";
import status from "http-status";
import { ApiError } from "next/dist/server/api-utils";
import { ZodError } from "zod";
import { deleteSessionTokenCookie } from "../utils/session";
import { MESSAGE } from "@/constants/message";

export const errorHandler = async (error: unknown) => {
    console.error("ERROR ASLI:", error);
    const message = MESSAGE.GLOBAL;
    if (error instanceof Error) {
        if (error instanceof ApiError) {
            if (error.statusCode === status.UNAUTHORIZED) {
                await deleteSessionTokenCookie();
            }
            return { status: error.statusCode, message: error.message };
        };
        if (error instanceof ZodError) return { status: status.BAD_REQUEST, message: error.issues[0]?.message ?? "Data tidak valid" };
        if (error instanceof PrismaClientKnownRequestError) {
            if (error.code === "P2002") return { status: status.BAD_REQUEST, message: "Data sudah terdaftar" };
            if (error.code === "P2025") return { status: status.NOT_FOUND, message: "Data tidak ditemukan" };
        }
    }
    return { status: status.INTERNAL_SERVER_ERROR, message: message.INTERNAL_SERVER_ERROR };
}
