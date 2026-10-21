import { delay, matchesSearch, paginate, sortByKey } from "@/services/delay";
import type { ContactStatus, ContactSubmission, PaginatedResult } from "@/types";

/** No Phase A contact table yet — start empty (no seeded mock submissions). */
let submissions: ContactSubmission[] = [];

export interface ContactListParams {
  search?: string;
  status?: ContactStatus | "all";
  page?: number;
  pageSize?: number;
  sortBy?: keyof ContactSubmission;
  sortDir?: "asc" | "desc";
}

export async function listSubmissions(
  params: ContactListParams = {},
): Promise<PaginatedResult<ContactSubmission>> {
  await delay();
  const {
    search,
    status = "all",
    page = 1,
    pageSize = 10,
    sortBy = "createdAt",
    sortDir = "desc",
  } = params;

  let rows = submissions.filter((s) => {
    const hay = `${s.name} ${s.email} ${s.subject} ${s.phone}`;
    if (!matchesSearch(hay, search)) return false;
    if (status !== "all" && s.status !== status) return false;
    return true;
  });

  rows = sortByKey(rows, sortBy, sortDir);
  return paginate(rows, page, pageSize);
}

export async function getSubmission(id: string): Promise<ContactSubmission | null> {
  await delay();
  return submissions.find((s) => s.id === id) ?? null;
}

export async function setSubmissionStatus(
  id: string,
  status: ContactStatus,
): Promise<ContactSubmission> {
  await delay();
  const index = submissions.findIndex((s) => s.id === id);
  if (index === -1) throw new Error("Submission not found");
  const next = { ...submissions[index], status };
  submissions = submissions.map((s, i) => (i === index ? next : s));
  return next;
}

export async function deleteSubmission(id: string): Promise<void> {
  await delay();
  submissions = submissions.filter((s) => s.id !== id);
}

export function getSubmissionsSnapshot() {
  return submissions;
}
