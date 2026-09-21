import { findManyPermohonanSKUSchema } from "@/lib/validators/permohonan-sku";
import { ApiError } from "next/dist/server/api-utils";
import { countPermohonanSKUService, findManyPermohonanSKUService, findPermohonanSKUByIdService } from "../services/permohonan-sku";
import status from "http-status";
import { MESSAGE } from "@/constants/message";

export const findManyPermohonanSKUData = async (searchParams: Promise<{ [key: string]: string }>) => {
    try {
        const rawParams = await searchParams;
        const params = findManyPermohonanSKUSchema.parse(rawParams);
        const { data, pagination } = await findManyPermohonanSKUService(params);
        return { params, data, pagination };
    } catch (error) {
        if (error instanceof ApiError) throw error;
        throw new ApiError(status.INTERNAL_SERVER_ERROR, MESSAGE.GLOBAL.INTERNAL_SERVER_ERROR);
    }
}

export const findPermohonanSKUData = async (params: Promise<{ id: string }>) => {
    try {
        const rawParams = await params;
        const data = await findPermohonanSKUByIdService(rawParams.id);
        
        if (!data) throw new ApiError(status.NOT_FOUND, MESSAGE.GLOBAL.NOT_FOUND);
        return { data };
    } catch (error) {
        if (error instanceof ApiError) throw error;
        throw new ApiError(status.INTERNAL_SERVER_ERROR, MESSAGE.GLOBAL.INTERNAL_SERVER_ERROR);
    }
}

export const findPermohonanSKUCountData = async () => {
    try {
        const data = await countPermohonanSKUService({});
        return { data };
    } catch (error) {
        if (error instanceof ApiError) throw error;
        throw new ApiError(status.INTERNAL_SERVER_ERROR, MESSAGE.GLOBAL.INTERNAL_SERVER_ERROR);
    }
}
