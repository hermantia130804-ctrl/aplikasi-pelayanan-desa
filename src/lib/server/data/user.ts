import { findManyUserSchema } from "@/lib/validators/user";
import { countUserService, findManyUserService, findUserService } from "../services/user";
import { ApiError } from "next/dist/server/api-utils";
import status from "http-status";
import { MESSAGE } from "@/constants/message";

export const findManyUserData = async (searchParams: Promise<{ [key: string]: string }>) => {
    try {
        const rawParams = await searchParams;
        const params = findManyUserSchema.parse(rawParams);
        const { data, pagination } = await findManyUserService(params);
        return { params, data, pagination };
    } catch (error) {
        if (error instanceof ApiError) throw error;
        throw new ApiError(status.INTERNAL_SERVER_ERROR, MESSAGE.GLOBAL.INTERNAL_SERVER_ERROR);
    }
}

export const findUserData = async (params: Promise<{ id: string }>) => {
    try {
        const rawParams = await params;
        const { data } = await findUserService(rawParams.id);
        if (!data) throw new ApiError(status.NOT_FOUND, MESSAGE.GLOBAL.NOT_FOUND);
        return { data };
    } catch (error) {
        if (error instanceof ApiError) throw error;
        throw new ApiError(status.INTERNAL_SERVER_ERROR, MESSAGE.GLOBAL.INTERNAL_SERVER_ERROR);
    }
}

export const findUserCountData = async () => {
    try {
        const user = await countUserService({ role: "USER" });
        const admin = await countUserService({ role: "ADMIN" });
        const active = await countUserService({ status: "ACTIVE" });
        const inactive = await countUserService({ status: "INACTIVE" });
        return { data: { user, admin, active, inactive } };
    } catch (error) {
        if (error instanceof ApiError) throw error;
        throw new ApiError(status.INTERNAL_SERVER_ERROR, MESSAGE.GLOBAL.INTERNAL_SERVER_ERROR);
    }
}