import { findManyPermohonanPindahService, findPermohonanPindahByIdService } from "@/lib/server/services/permohonan-pindah";
import { findManyPermohonanPindahSchema } from "@/lib/validators/permohonan-pindah";
import { ApiError } from "next/dist/server/api-utils";
import status from "http-status";
import { MESSAGE } from "@/constants/message";

export const findManyPermohonanPindahData = async (params: Record<string, string>) => {
  try {
    const validatedParams = findManyPermohonanPindahSchema.parse(params);
    return await findManyPermohonanPindahService(validatedParams);
  } catch (error) {
    console.error("Error in findManyPermohonanPindahData:", error);
    throw new ApiError(status.BAD_REQUEST, "Parameter tidak valid");
  }
};

export const findPermohonanPindahData = async (params: { id: string }) => {
  try {
    if (!params.id) {
      throw new ApiError(status.BAD_REQUEST, "ID permohonan pindah wajib diisi");
    }

    const data = await findPermohonanPindahByIdService(params.id);
    
    if (!data) {
      throw new ApiError(status.NOT_FOUND, MESSAGE.PERMOHONAN_PINDAH.NOT_FOUND);
    }

    return { data };
  } catch (error) {
    console.error("Error in findPermohonanPindahData:", error);
    if (error instanceof ApiError) {
      throw error;
    }
    throw new ApiError(status.INTERNAL_SERVER_ERROR, "Gagal mengambil data permohonan pindah");
  }
};
