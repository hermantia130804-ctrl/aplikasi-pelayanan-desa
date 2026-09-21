import { PrismaClientKnownRequestError } from "@prisma/client/runtime/library";
import status from "http-status";
import { ApiError } from "next/dist/server/api-utils";
import { ZodError } from "zod";
import { deleteSessionTokenCookie } from "../utils/session";
import { MESSAGE } from "@/constants/message";

export const errorHandler = async (error: unknown) => {
    const message = MESSAGE.GLOBAL;
    if (error instanceof Error) {
        if (error instanceof ApiError) {
            if (error.statusCode === status.UNAUTHORIZED) {
                await deleteSessionTokenCookie();
            }
            throw error;
        };
        if (error instanceof ZodError) throw new ApiError(status.BAD_REQUEST, error.message);
        if (error instanceof PrismaClientKnownRequestError) {
            if (error.code === "P2002") throw new ApiError(status.BAD_REQUEST, message.BAD_REQUEST);
            if (error.code === "P2025") throw new ApiError(status.NOT_FOUND, message.NOT_FOUND);
            else throw new ApiError(status.INTERNAL_SERVER_ERROR, message.INTERNAL_SERVER_ERROR);
        }
    }
    throw new ApiError(status.INTERNAL_SERVER_ERROR, message.INTERNAL_SERVER_ERROR);
}