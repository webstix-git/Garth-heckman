export type NotificationTab = "all" | "messages" | "alerts";

export interface AdminNotification {
  id: string;
  tab: Exclude<NotificationTab, "all">;
  title?: string;
  body: string;
  highlight?: string;
  href?: string;
  time: string;
  avatar?: string;
  icon?: "message" | "check";
}

/** Live notifications are not wired yet — keep empty so the UI stays free of fake data. */
export const mockNotifications: AdminNotification[] = [];
