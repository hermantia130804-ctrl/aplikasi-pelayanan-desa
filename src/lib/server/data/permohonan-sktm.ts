import { findManyPermohonanSKTMSchema } from "@/lib/validators/permohonan-sktm";
import { ApiError } from "next/dist/server/api-utils";
import { countPermohonanSKTMService, findManyPermohonanSKTMService, findByIdPermohonanSKTMService } from "../services/permohonan-sktm";
import status from "http-status";
import { MESSAGE } from "@/constants/message";

export const findManyPermohonanSKTMData = async (searchParams: Promise<{ [key: string]: string }>) => {
  try {
    const rawParams = await searchParams;
    const params = findManyPermohonanSKTMSchema.parse(rawParams);
    
    const where = {
      AND: [
        { statusPermohonan: params.status },
        { createdAt: { gte: params.dateFrom, lte: params.dateTo } },
        params.search && params.searchField
          ? { [params.searchField]: { contains: params.search, mode: "insensitive" } }
          : {},
      ].filter(Boolean),
    };

    const [data, total] = await Promise.all([
      findManyPermohonanSKTMService(params),
      countPermohonanSKTMService(where),
    ]);

    const pagination = {
      page: params.page,
      limit: params.limit,
      total,
      totalPages: Math.ceil(total / params.limit),
    };

    return { params, data, pagination };
  } catch (error) {
    if (error instanceof ApiError) throw error;
    throw new ApiError(status.INTERNAL_SERVER_ERROR, MESSAGE.GLOBAL.INTERNAL_SERVER_ERROR);
  }
};

export const findPermohonanSKTMData = async (params: Promise<{ id: string }>) => {
  try {
    const rawParams = await params;
    const data = await findByIdPermohonanSKTMService(rawParams.id);
    
    if (!data) throw new ApiError(status.NOT_FOUND, MESSAGE.GLOBAL.NOT_FOUND);
    return { data };
  } catch (error) {
    if (error instanceof ApiError) throw error;
    throw new ApiError(status.INTERNAL_SERVER_ERROR, MESSAGE.GLOBAL.INTERNAL_SERVER_ERROR);
  }
};
