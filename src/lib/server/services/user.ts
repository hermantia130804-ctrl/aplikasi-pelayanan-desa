import { Prisma, Role, Status } from "@/generated/prisma";
import { prisma } from "@/lib/prisma";
import { hashPassword } from "@/lib/server/utils/password";
import { TCreateUserSchema, TFindManyUserSchema, TUpdateUserSchema } from "@/lib/validators/user";

// FIND SERVICE

export const findUserService = async (userId: string) => {
	const data = await prisma.user.findUnique({ where: { userId }, omit: { password: true } });
	return { data };
}

export const countUserService = async (where: Prisma.UserWhereInput) => {
	const data = await prisma.user.count({ where });
	return data;
}

export const findManyUserService = async (query: TFindManyUserSchema) => {
	const {
		limit,
		page,
		dateFrom,
		dateTo,
		status,
		role,
		searchBy,
		orderby,
		searchValue,
		orderDirection,
	} = query;
	const skip = (page - 1) * limit;
	const take = limit;
	const orderBy = { [orderby]: orderDirection };
	const where: Prisma.UserWhereInput = {
		AND: [
			{ role },
			{ status },
			{ createdAt: { gte: dateFrom, lte: dateTo } },
			{ [searchBy]: { contains: searchValue, mode: "insensitive" } },
		]
	};
	const data = await prisma.user.findMany({
		take,
		skip,
		where,
		orderBy,
		omit: { password: true },
	});
	const totalItems = await prisma.user.count({ where });
	const totalPages = Math.ceil(totalItems / limit);
	return { data, pagination: { totalItems, totalPages, currentPage: page } };
}

export const findUserByEmailService = async (email: string) => {
	const data = await prisma.user.findUnique({ where: { email } });
	return { data };
}

// CREATE SERVICE

export const createUserService = async (payload: TCreateUserSchema) => {
	payload.password = await hashPassword(payload.password);
	const data = await prisma.user.create({ data: payload });
	return { data };
}

// UPDATE SERVICE

export const updateUserService = async (userId: string, payload: TUpdateUserSchema) => {
	const data = await prisma.user.update({ where: { userId }, data: payload });
	return { data };
}

export const updateUserPasswordService = async (userId: string, password: string) => {
	const passwordHash = await hashPassword(password);
	await prisma.user.update({ where: { userId }, data: { password: passwordHash } });
}

export const updateUserAsVerifiedService = async (userId: string) => {
	await prisma.user.update({ where: { userId }, data: { verifiedAt: new Date() } });
}

export const updateUserStatusService = async (userId: string, status: Status) => {
	await prisma.user.update({ where: { userId }, data: { status } });
}

export const updateUserRoleService = async (userId: string, role: Role) => {
	await prisma.user.update({ where: { userId }, data: { role } });
}

// DELETE SERVICE

export const deleteUserService = async (userId: string) => {
	const data = await prisma.user.delete({ where: { userId } });
	return { data };
}

export const activateUserService = async (userId: string) => {
    const data = await prisma.user.update({ where: { userId }, data: { status: "ACTIVE" } });
    return { data };
}

export const findUserByIdService = async (userId: string) => {
    const data = await prisma.user.findUnique({ where: { userId } });
    return { data };
}
