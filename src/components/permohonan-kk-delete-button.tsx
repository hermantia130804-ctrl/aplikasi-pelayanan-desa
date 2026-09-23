"use client";

import { Button } from "@/components/ui/button";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog";
import { deletePermohonanKKAction } from "@/lib/server/actions/permohonan-kk";
import { TrashIcon, Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";

type PermohonanKKDeleteButtonProps = {
    permohonanKKId: string;
};

export const PermohonanKKDeleteButton = ({ permohonanKKId }: PermohonanKKDeleteButtonProps) => {
    const router = useRouter();
    const [open, setOpen] = useState(false);
    const [loading, setLoading] = useState(false);

    const onDelete = async () => {
        try {
            setLoading(true);
            const response = await deletePermohonanKKAction(permohonanKKId);
            if (response.status === 200) {
                toast.success(response.message);
                setOpen(false);
                router.refresh();
            } else {
                toast.error(response.message);
            }
        } catch (error) {
            console.error(error);
            toast.error("Terjadi kesalahan saat menghapus");
        } finally {
            setLoading(false);
        }
    };

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button variant="ghost" size="icon" disabled={loading}>
                    <TrashIcon className="text-red-500" />
                </Button>
            </DialogTrigger>
            <DialogContent className="max-w-md">
                <DialogHeader>
                    <DialogTitle>Konfirmasi Hapus</DialogTitle>
                    <DialogDescription>
                        Apakah Anda yakin ingin menghapus permohonan KK ini? Tindakan ini
                        tidak dapat dibatalkan.
                    </DialogDescription>
                </DialogHeader>
                <DialogFooter className="flex gap-2">
                    <Button type="button" variant="outline" onClick={() => setOpen(false)} disabled={loading}>
                        Batal
                    </Button>
                    <Button type="button" variant="destructive" onClick={onDelete} disabled={loading}>
                        {loading && <Loader2 className="w-4 h-4 animate-spin mr-1" />}
                        Hapus
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
};
