import { redirect } from "next/navigation";
import type { ReactNode } from "react";

import { auth } from "@/auth";
import { AdminShell } from "@/components/layout/admin-shell";

export default async function AdminGroupLayout({ children }: { children: ReactNode }) {
  const session = await auth();
  if (!session?.user) redirect("/admin/login");

  return <AdminShell>{children}</AdminShell>;
}
