import { findManyPermohonanSKKSchema } from "@/lib/validators/permohonan-skk";
import { ApiError } from "next/dist/server/api-utils";
import { countPermohonanSKKService, findManyPermohonanSKKService, findPermohonanSKKByIdService } from "../services/permohonan-skk";
import status from "http-status";
import { MESSAGE } from "@/constants/message";

export const findManyPermohonanSKKData = async (searchParams: Promise<{ [key: string]: string }>) => {
    try {
        const rawParams = await searchParams;
        const params = findManyPermohonanSKKSchema.parse(rawParams);
        const { data, pagination } = await findManyPermohonanSKKService(params);
        return { params, data, pagination };
    } catch (error) {
        if (error instanceof ApiError) throw error;
        throw new ApiError(status.INTERNAL_SERVER_ERROR, MESSAGE.GLOBAL.INTERNAL_SERVER_ERROR);
    }
}

export const findPermohonanSKKData = async (params: Promise<{ id: string }>) => {
    try {
        const rawParams = await params;
        const data = await findPermohonanSKKByIdService(rawParams.id);
        
        if (!data) throw new ApiError(status.NOT_FOUND, MESSAGE.GLOBAL.NOT_FOUND);
        return { data };
    } catch (error) {
        if (error instanceof ApiError) throw error;
        throw new ApiError(status.INTERNAL_SERVER_ERROR, MESSAGE.GLOBAL.INTERNAL_SERVER_ERROR);
    }
}

export const findPermohonanSKKCountData = async () => {
    try {
        const data = await countPermohonanSKKService({});
        return { data };
    } catch (error) {
        if (error instanceof ApiError) throw error;
        throw new ApiError(status.INTERNAL_SERVER_ERROR, MESSAGE.GLOBAL.INTERNAL_SERVER_ERROR);
    }
}
