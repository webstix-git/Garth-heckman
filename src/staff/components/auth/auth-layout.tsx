import type { ReactNode } from "react";

import { Card, CardContent } from "@/components/ui/card";

export function AuthLayout({ children }: { children: ReactNode }) {
  return (
    <div className="grid min-h-svh lg:grid-cols-[60%_40%]">
      <div className="relative hidden overflow-hidden bg-[radial-gradient(circle_at_25%_20%,#3f3f46_0%,#18181b_42%,#09090b_100%)] lg:block" />
      <div className="flex flex-col justify-center bg-[#f6f6f7] px-6 py-10 text-neutral-900 sm:px-8">
        <div className="mx-auto w-full max-w-[28rem]">
          <div className="mb-5">
            <p className="text-lg font-semibold tracking-tight text-neutral-900">Welcome back</p>
            <p className="mt-1 text-sm text-neutral-500">Sign in to continue to your account.</p>
          </div>
          <Card className="border-[#dedee1] bg-white shadow-[0_12px_32px_rgba(0,0,0,0.08)]">
            <CardContent className="p-0">{children}</CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
