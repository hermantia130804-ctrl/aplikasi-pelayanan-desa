import { MESSAGE } from "@/constants/message";
import { findManyPermohonanSKDSchema } from "@/lib/validators/permohonan-skd";
import status from "http-status";
import { ApiError } from "next/dist/server/api-utils";
import { findManyPermohonanSKDService, findPermohonanSKDService } from "../services/permohonan-skd";

export async function findManyPermohonanSKDData(searchParams: Record<string, string | string[] | undefined>) {
    try {
        const validatedParams = findManyPermohonanSKDSchema.parse(searchParams);
        return await findManyPermohonanSKDService(validatedParams);
    } catch (error) {
        if (error instanceof ApiError) throw error;
        throw new ApiError(status.INTERNAL_SERVER_ERROR, MESSAGE.GLOBAL.INTERNAL_SERVER_ERROR);
    }
}

export async function findPermohonanSKDData(params: { id: string }) {
    try {
        const permohonan = await findPermohonanSKDService(params.id);
        if (!permohonan) {
            throw new ApiError(status.NOT_FOUND, MESSAGE.PERMOHONAN_SKD.NOT_FOUND);
        }
        return { data: permohonan };
    } catch (error) {
        if (error instanceof ApiError) throw error;
        throw new ApiError(status.INTERNAL_SERVER_ERROR, MESSAGE.GLOBAL.INTERNAL_SERVER_ERROR);
    }
}
