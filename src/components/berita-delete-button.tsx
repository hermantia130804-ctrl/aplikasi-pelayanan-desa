"use client";

import { Button } from "@/components/ui/button";
import {
    Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger,
} from "@/components/ui/dialog";
import { deleteBeritaAction } from "@/lib/server/actions/berita";
import { TrashIcon, Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";

export const BeritaDeleteButton = ({ beritaId }: { beritaId: string }) => {
    const router = useRouter();
    const [open, setOpen] = useState(false);
    const [loading, setLoading] = useState(false);

    const onDelete = async () => {
        try {
            setLoading(true);
            const res = await deleteBeritaAction(beritaId);
            if (res.status === 200) {
                toast.success(res.message);
                setOpen(false);
                router.refresh();
            } else {
                toast.error(res.message);
            }
        } catch {
            toast.error("Gagal menghapus berita");
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
                        Hapus berita ini beserta gambarnya? Tindakan ini tidak dapat dibatalkan.
                    </DialogDescription>
                </DialogHeader>
                <DialogFooter>
                    <Button variant="outline" onClick={() => setOpen(false)} disabled={loading}>Batal</Button>
                    <Button variant="destructive" onClick={onDelete} disabled={loading}>
                        {loading && <Loader2 className="w-4 h-4 animate-spin mr-1" />} Hapus
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
};
