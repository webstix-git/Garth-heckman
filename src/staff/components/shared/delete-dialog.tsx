"use client";

import { ConfirmDialog } from "@/components/shared/confirm-dialog";

interface DeleteDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title?: string;
  description?: string;
  confirmLabel?: string;
  loading?: boolean;
  onConfirm: () => void | Promise<void>;
}

export function DeleteDialog({
  open,
  onOpenChange,
  title = "Delete item",
  description = "Are you sure you want to delete this? This cannot be undone.",
  confirmLabel = "Delete",
  loading,
  onConfirm,
}: DeleteDialogProps) {
  return (
    <ConfirmDialog
      open={open}
      onOpenChange={onOpenChange}
      title={title}
      description={description}
      confirmLabel={confirmLabel}
      variant="destructive"
      loading={loading}
      onConfirm={onConfirm}
    />
  );
}
