"use client";
import { updateUserStatusAction } from "@/lib/server/actions/user";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./ui/select";
import { Status } from "@/generated/prisma";
import { toast } from "sonner";
import { MESSAGE } from "@/constants/message";
import { IconCircleCheckFilled, IconLoader } from "@tabler/icons-react";

export type UserUpdateStatusProps = {
    userId: string;
    status: string;
};

export const UserUpdateStatus = ({ status, userId }: UserUpdateStatusProps) => {

    const onStatusChange = async (value: string) => {
        try {
           const response = await updateUserStatusAction(userId, value as Status);
           if (response.status !== 200) throw new Error(response.message);
           toast.success(response.message);
        } catch (error) {
            if (error instanceof Error) toast.error(error.message);
            else toast.error(MESSAGE.GLOBAL.INTERNAL_SERVER_ERROR);
        }
    };

    return (
        <Select
            defaultValue={status}
            onValueChange={(value) => onStatusChange(value)}
        >
            <SelectTrigger className="w-full">
                <SelectValue placeholder="Pilih Status" />
            </SelectTrigger>
            <SelectContent>
                <SelectItem value="ACTIVE"><IconCircleCheckFilled className="fill-green-500 dark:fill-green-400" /> Aktif</SelectItem>
                <SelectItem value="INACTIVE"><IconLoader /> Tidak Aktif</SelectItem>
            </SelectContent>
        </Select>
    );
};