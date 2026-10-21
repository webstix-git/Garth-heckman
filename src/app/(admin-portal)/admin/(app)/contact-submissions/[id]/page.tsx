"use client";

import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";

import { DeleteDialog } from "@/components/shared/delete-dialog";
import { ErrorState } from "@/components/shared/error-state";
import { LoadingState } from "@/components/shared/loading-state";
import { PageHeader } from "@/components/shared/page-header";
import { SectionCard } from "@/components/shared/section-card";
import { StatusBadge } from "@/components/shared/status-badge";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useAsyncData } from "@/hooks/use-async-data";
import { formatDateTime, initials, titleCase } from "@/lib/format";
import {
  deleteSubmission,
  getSubmission,
  setSubmissionStatus,
} from "@/services/contact";
import { CONTACT_STATUSES, type ContactStatus } from "@/types";

const STATUS_HINT: Record<ContactStatus, string> = {
  new: "Unread in the inbox",
  read: "Opened",
  responded: "A reply has been sent",
  archived: "Hidden from the main inbox",
};

export default function ContactDetailPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const submission = useAsyncData(() => getSubmission(params.id), params.id);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [busy, setBusy] = useState(false);

  if (submission.loading) return <LoadingState />;
  if (!submission.data) return <ErrorState title="Submission not found" />;

  const s = submission.data;

  async function setStatus(status: ContactStatus) {
    const next = await setSubmissionStatus(s.id, status);
    submission.setData(next);
    toast.success(`Marked ${titleCase(status)}`);
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title={s.subject}
        description={`Received ${formatDateTime(s.createdAt)}`}
        actions={
          <>
            <StatusBadge status={s.status} />
            <Button variant="outline" render={<Link href="/admin/contact-submissions" />}>
              Inbox
            </Button>
            <Button variant="destructive" onClick={() => setConfirmDelete(true)}>
              Delete
            </Button>
          </>
        }
      />

      <div className="product-editor-grid grid items-start gap-5 lg:gap-6">
        <div className="product-editor-column">
        <SectionCard title="Message">
          <div className="flex items-start gap-3">
          <span className="flex size-11 shrink-0 items-center justify-center rounded-full bg-[#5c3758]/10 text-sm font-medium text-[#5c3758] dark:bg-white/10 dark:text-white">
              {initials(s.name)}
            </span>
            <div className="min-w-0 flex-1">
              <p className="text-sm font-medium">{s.name}</p>
              <a
                href={`mailto:${s.email}`}
                className="mt-0.5 block truncate text-sm text-muted-foreground hover:underline"
              >
                {s.email}
              </a>
              {s.phone ? (
                <a
                  href={`tel:${s.phone}`}
                  className="mt-0.5 block text-sm text-muted-foreground hover:underline"
                >
                  {s.phone}
                </a>
              ) : null}
            </div>
          </div>
          <div className="mt-4 rounded-lg border bg-muted/20 px-4 py-4">
            <p className="whitespace-pre-wrap text-sm leading-7">{s.message}</p>
          </div>
        </SectionCard>
        </div>

        <div className="product-editor-column">
        <SectionCard title="Status">
          <div className="flex items-center justify-between gap-3">
            <StatusBadge status={s.status} />
            <p className="text-right text-xs text-muted-foreground">{STATUS_HINT[s.status]}</p>
          </div>
          <div className="mt-4">
            <p className="mb-1.5 text-xs text-muted-foreground">Update status</p>
            <Select
              value={s.status}
              onValueChange={(value) => {
                if (!value) return;
                void setStatus(String(value) as ContactStatus);
              }}
            >
              <SelectTrigger className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent alignItemWithTrigger={false}>
                {CONTACT_STATUSES.map((status) => (
                  <SelectItem key={status} value={status}>
                    {titleCase(status)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </SectionCard>
        </div>
      </div>

      <DeleteDialog
        open={confirmDelete}
        onOpenChange={setConfirmDelete}
        title="Delete submission"
        description="This message will be removed. This cannot be undone."
        loading={busy}
        onConfirm={async () => {
          setBusy(true);
          await deleteSubmission(s.id);
          toast.success("Deleted");
          router.push("/admin/contact-submissions");
        }}
      />
    </div>
  );
}
