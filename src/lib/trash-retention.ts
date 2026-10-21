export const TRASH_RETENTION_DAYS = 30;

const TRASH_RETENTION_MS = TRASH_RETENTION_DAYS * 24 * 60 * 60 * 1000;

export function trashDaysRemaining(deletedAt: string): number {
  const purgeAt = new Date(deletedAt).getTime() + TRASH_RETENTION_MS;
  return Math.max(0, Math.ceil((purgeAt - Date.now()) / (24 * 60 * 60 * 1000)));
}
