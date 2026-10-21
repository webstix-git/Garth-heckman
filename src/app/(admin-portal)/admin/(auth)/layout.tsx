import { redirect } from "next/navigation";
import type { ReactNode } from "react";

import { auth } from "@/auth";
import { AuthLayout } from "@/components/auth/auth-layout";

export default async function AuthGroupLayout({ children }: { children: ReactNode }) {
  const session = await auth();
  if (session?.user) redirect("/admin/dashboard");

  return <AuthLayout>{children}</AuthLayout>;
}
