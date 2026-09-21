import { findManyPermohonanKTPSchema } from "@/lib/validators/permohonan-ktp";
import { ApiError } from "next/dist/server/api-utils";
import { countPermohonanKTPService, findManyPermohonanKTPService, findPermohonanKTPByIdService } from "../services/permohonan-ktp";
import status from "http-status";
import { MESSAGE } from "@/constants/message";

export const findManyPermohonanKTPData = async (searchParams: Promise<{ [key: string]: string }>) => {
    try {
        const rawParams = await searchParams;
        const params = findManyPermohonanKTPSchema.parse(rawParams);
        const { data, pagination } = await findManyPermohonanKTPService(params);
        return { params, data, pagination };
    } catch (error) {
        if (error instanceof ApiError) throw error;
        throw new ApiError(status.INTERNAL_SERVER_ERROR, MESSAGE.GLOBAL.INTERNAL_SERVER_ERROR);
    }
}

export const findPermohonanKTPData = async (params: Promise<{ id: string }>) => {
    try {
        const rawParams = await params;
        const data = await findPermohonanKTPByIdService(rawParams.id);
        
        if (!data) throw new ApiError(status.NOT_FOUND, MESSAGE.GLOBAL.NOT_FOUND);
        return { data };
    } catch (error) {
        if (error instanceof ApiError) throw error;
        throw new ApiError(status.INTERNAL_SERVER_ERROR, MESSAGE.GLOBAL.INTERNAL_SERVER_ERROR);
    }
}

export const findPermohonanKTPCountData = async () => {
    try {
        const diajukan = await countPermohonanKTPService({ statusPermohonan: "DIAJUKAN" });
        const ditolak = await countPermohonanKTPService({ statusPermohonan: "DITOLAK" });
        const disetujui = await countPermohonanKTPService({ statusPermohonan: "DISETUJUI" });
        return { data: { diajukan, ditolak, disetujui } };
    } catch (error) {
        if (error instanceof ApiError) throw error;
        throw new ApiError(status.INTERNAL_SERVER_ERROR, MESSAGE.GLOBAL.INTERNAL_SERVER_ERROR);
    }
}
