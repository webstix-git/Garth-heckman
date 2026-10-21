import type { Metadata } from "next";
import { Suspense } from "react";

import { LoginForm } from "@/components/auth/login-form";

export const metadata: Metadata = {
  title: "Login",
};

export default function LoginPage() {
  return (
    <Suspense fallback={<div className="px-8 py-12 text-neutral-600">Loading…</div>}>
      <LoginForm />
    </Suspense>
  );
}
