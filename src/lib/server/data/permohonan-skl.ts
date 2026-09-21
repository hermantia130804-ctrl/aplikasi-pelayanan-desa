import { findManyPermohonanSKLSchema } from "@/lib/validators/permohonan-skl";
import { ApiError } from "next/dist/server/api-utils";
import { countPermohonanSKLService, findManyPermohonanSKLService, findPermohonanSKLByIdService } from "../services/permohonan-skl";
import status from "http-status";
import { MESSAGE } from "@/constants/message";

export const findManyPermohonanSKLData = async (searchParams: Promise<{ [key: string]: string }>) => {
    try {
        const rawParams = await searchParams;
        const params = findManyPermohonanSKLSchema.parse(rawParams);
        const { data, pagination } = await findManyPermohonanSKLService(params);
        return { params, data, pagination };
    } catch (error) {
        if (error instanceof ApiError) throw error;
        throw new ApiError(status.INTERNAL_SERVER_ERROR, MESSAGE.GLOBAL.INTERNAL_SERVER_ERROR);
    }
}

export const findPermohonanSKLData = async (params: Promise<{ id: string }>) => {
    try {
        const rawParams = await params;
        const data = await findPermohonanSKLByIdService(rawParams.id);
        
        if (!data) throw new ApiError(status.NOT_FOUND, MESSAGE.GLOBAL.NOT_FOUND);
        return { data };
    } catch (error) {
        if (error instanceof ApiError) throw error;
        throw new ApiError(status.INTERNAL_SERVER_ERROR, MESSAGE.GLOBAL.INTERNAL_SERVER_ERROR);
    }
}

export const findPermohonanSKLCountData = async () => {
    try {
        const diajukan = await countPermohonanSKLService({ statusPermohonan: "DIAJUKAN" });
        const ditolak = await countPermohonanSKLService({ statusPermohonan: "DITOLAK" });
        const disetujui = await countPermohonanSKLService({ statusPermohonan: "DISETUJUI" });
        return { data: { diajukan, ditolak, disetujui } };
    } catch (error) {
        if (error instanceof ApiError) throw error;
        throw new ApiError(status.INTERNAL_SERVER_ERROR, MESSAGE.GLOBAL.INTERNAL_SERVER_ERROR);
    }
}
