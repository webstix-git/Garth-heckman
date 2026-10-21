import type { Metadata } from "next";
import type { ReactNode } from "react";

import { auth } from "@/auth";
import { ThemeProvider } from "@/components/layout/theme-provider";
import { AuthSessionProvider } from "@/components/providers/session-provider";
import { StoreBrandProvider } from "@/components/providers/store-brand-provider";
import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { getSettings as getStoreSettings } from "@/services/settings-server";

/* Live Tailwind source (same as original admin globals.css) */
import "@/styles/staff-admin.generated.css";

export const metadata: Metadata = {
  title: {
    default: "Commerce Admin",
    template: "%s · Commerce Admin",
  },
  description: "Multi-store eCommerce administration platform",
};

export default async function AdminPortalLayout({ children }: { children: ReactNode }) {
  const session = await auth();
  let initialSettings = null;
  try {
    initialSettings = await getStoreSettings();
  } catch {
    initialSettings = null;
  }

  return (
    <div
      className="staff-admin min-h-full bg-background font-sans text-foreground antialiased"
    >
      <AuthSessionProvider initialUser={session?.user ?? null}>
        <StoreBrandProvider initialSettings={initialSettings}>
          <ThemeProvider>
            <TooltipProvider>
              {children}
              <Toaster position="top-right" />
            </TooltipProvider>
          </ThemeProvider>
        </StoreBrandProvider>
      </AuthSessionProvider>
    </div>
  );
}
