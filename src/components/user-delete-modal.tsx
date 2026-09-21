"use client"

import { Button } from "@/components/ui/button";
import { MESSAGE } from "@/constants/message";
import { deleteUserAction } from "@/lib/server/actions/user";
import { useState } from "react";
import { toast } from "sonner";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "./ui/alert-dialog";
import { IconLoader } from "@tabler/icons-react";
import { Trash2Icon } from "lucide-react";

type UserDeleteModalProps = {
    userId: string;
}

export const UserDeleteModal = ({ userId }: UserDeleteModalProps) => {

    const [open, setOpen] = useState(false);
    const [loading, setLoading] = useState(false);

    const onDelete = async () => {
        try {
            setLoading(true);
            const response = await deleteUserAction(userId);
            if (response.status !== 200) throw new Error(response.message);
            toast.success(response.message);
        } catch (error) {
            if (error instanceof Error) toast.error(error.message);
            else toast.error(MESSAGE.GLOBAL.INTERNAL_SERVER_ERROR);
        } finally {
            setLoading(false);
        }
    };
    return (
        <AlertDialog open={open} onOpenChange={setOpen}>
            <AlertDialogTrigger asChild>
                <Button variant="ghost" size="icon">
                    <Trash2Icon className="text-red-500" />
                </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
                <AlertDialogHeader>
                    <AlertDialogTitle>Peringatan</AlertDialogTitle>
                    <AlertDialogDescription>
                        Apakah anda yakin ingin menghapus pengguna ini ? Data yang dihapus tidak dapat dikembalikan.
                    </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                    <AlertDialogAction onClick={onDelete} disabled={loading}>
                        {loading ? <IconLoader className="animate-spin" /> : "Hapus"}
                    </AlertDialogAction>
                </AlertDialogFooter>
            </AlertDialogContent>
        </AlertDialog>
    );
};