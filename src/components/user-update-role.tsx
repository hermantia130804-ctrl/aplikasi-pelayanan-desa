"use client";
import { MESSAGE } from "@/constants/message";
import { Role } from "@/generated/prisma";
import { updateUserRoleAction } from "@/lib/server/actions/user";
import { Crown, UserCog2Icon, UserIcon } from "lucide-react";
import { toast } from "sonner";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./ui/select";

export type UserUpdateRoleProps = {
    userId: string;
    role: Role;
};

export const UserUpdateRole = ({ role, userId }: UserUpdateRoleProps) => {

    const onRoleChange = async (value: string) => {
        try {
           const response = await updateUserRoleAction(userId, value as Role);
           if (response.status !== 200) throw new Error(response.message);
           toast.success(response.message);
        } catch (error) {
            if (error instanceof Error) toast.error(error.message);
            else toast.error(MESSAGE.GLOBAL.INTERNAL_SERVER_ERROR);
        }
    };

    return (
        <Select
            defaultValue={role}
            onValueChange={onRoleChange}
        >
            <SelectTrigger>
                <SelectValue placeholder="Pilih Peran" />
            </SelectTrigger>
            <SelectContent>
                <SelectItem value="ADMIN"><Crown className="mr-2" /> Admin Full Control</SelectItem>
                <SelectItem value="PETUGAS"><UserCog2Icon className="mr-2" /> Petugas</SelectItem>
                <SelectItem value="USER"><UserIcon className="mr-2" /> Masyarakat</SelectItem>
            </SelectContent>
        </Select>
    );
};
