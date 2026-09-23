import { findManyPermohonanKKSchema } from "@/lib/validators/permohonan-kk";
import { ApiError } from "next/dist/server/api-utils";
import { findManyPermohonanKKService, findPermohonanKKByIdService } from "../services/permohonan-kk";
import status from "http-status";
import { MESSAGE } from "@/constants/message";

export const findManyPermohonanKKData = async (searchParams: Promise<{ [key: string]: string }>) => {
    try {
        const rawParams = await searchParams;
        const params = findManyPermohonanKKSchema.parse(rawParams);
        const { data, pagination } = await findManyPermohonanKKService(params);
        return { params, data, pagination };
    } catch (error) {
        if (error instanceof ApiError) throw error;
        throw new ApiError(status.INTERNAL_SERVER_ERROR, MESSAGE.GLOBAL.INTERNAL_SERVER_ERROR);
    }
}

export const findPermohonanKKData = async (params: Promise<{ id: string }>) => {
    try {
        const rawParams = await params;
        const data = await findPermohonanKKByIdService(rawParams.id);
        if (!data) throw new ApiError(status.NOT_FOUND, MESSAGE.GLOBAL.NOT_FOUND);
        return { data };
    } catch (error) {
        if (error instanceof ApiError) throw error;
        throw new ApiError(status.INTERNAL_SERVER_ERROR, MESSAGE.GLOBAL.INTERNAL_SERVER_ERROR);
    }
}
