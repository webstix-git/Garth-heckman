"use client";

import { useState, useSyncExternalStore, type ReactNode } from "react";

import { Header } from "@/components/layout/header";
import { NavigationProgress } from "@/components/layout/navigation-progress";
import { Sidebar } from "@/components/layout/sidebar";
import { useSession } from "@/components/providers/session-provider";
import { useStoreBrand } from "@/components/providers/store-brand-provider";
import { UnreadOrdersProvider } from "@/components/providers/unread-orders-provider";
import { Sheet, SheetContent } from "@/components/ui/sheet";
import { BRAND_NAVY } from "@/lib/constants";
import { cn } from "@/lib/utils";

const COLLAPSE_KEY = "gh.admin.sidebar.collapsed";
const COLLAPSE_EVENT = "gh-sidebar-collapsed";
const DEFAULT_SIDEBAR = "#1f1f1f";
const DEFAULT_NAV_INACTIVE = "#f5f5f5";
const DEFAULT_NAV_HEADING = "#a3a3a3";
const DEFAULT_BUTTON_BG = "#1f1f1f";
const DEFAULT_BUTTON_TEXT = "#ffffff";
const DEFAULT_HEADER = "#000000";

function subscribeCollapsed(onStoreChange: () => void) {
  window.addEventListener(COLLAPSE_EVENT, onStoreChange);
  return () => window.removeEventListener(COLLAPSE_EVENT, onStoreChange);
}

function getCollapsed() {
  return window.localStorage.getItem(COLLAPSE_KEY) === "1";
}

function BrandThemeStyles({
  primary,
  sidebar,
  navInactive,
  navHeading,
  buttonBg,
  buttonText,
}: {
  primary: string;
  sidebar: string;
  navInactive: string;
  navHeading: string;
  buttonBg: string;
  buttonText: string;
}) {
  // Brand colors apply to light theme only. Dark mode keeps the built-in defaults.
  const css = `
html:not(.dark) .staff-admin {
  --brand: ${primary};
  --nav-inactive: ${navInactive};
  --nav-heading: ${navHeading};
  --primary: ${buttonBg};
  --color-primary: ${buttonBg};
  --primary-foreground: ${buttonText};
  --color-primary-foreground: ${buttonText};
  --ring: ${buttonBg};
  --color-ring: ${buttonBg};
  --sidebar: ${sidebar};
  --color-sidebar: ${sidebar};
  --sidebar-foreground: ${navInactive};
  --color-sidebar-foreground: ${navInactive};
  --sidebar-primary: ${primary};
  --color-sidebar-primary: ${primary};
}
html:not(.dark) .staff-admin .bg-\\[var\\(--brand\\)\\] { background-color: ${primary} !important; }
html:not(.dark) .staff-admin .text-\\[var\\(--brand\\)\\] { color: ${primary} !important; }
html:not(.dark) .staff-admin .border-\\[var\\(--brand\\)\\] { border-color: ${primary} !important; }
html:not(.dark) .staff-admin .bg-\\[var\\(--brand\\)\\]\\/10 { background-color: color-mix(in srgb, ${primary} 12%, transparent) !important; }
html:not(.dark) .staff-admin .bg-\\[var\\(--brand\\)\\]\\/15 { background-color: color-mix(in srgb, ${primary} 15%, transparent) !important; }
html:not(.dark) .staff-admin .hover\\:bg-\\[var\\(--brand\\)\\]\\/15:hover { background-color: color-mix(in srgb, ${primary} 15%, transparent) !important; }
html:not(.dark) .staff-admin .hover\\:text-\\[var\\(--brand\\)\\]:hover { color: ${primary} !important; }
html:not(.dark) .staff-admin .text-\\[var\\(--nav-inactive\\)\\] { color: ${navInactive} !important; }
html:not(.dark) .staff-admin .text-\\[var\\(--nav-heading\\)\\] { color: ${navHeading} !important; }
html:not(.dark) .staff-admin button[data-slot="button"].bg-primary,
html:not(.dark) .staff-admin a[data-slot="button"].bg-primary,
html:not(.dark) .staff-admin .bg-primary {
  background-color: ${buttonBg} !important;
  color: ${buttonText} !important;
}
html:not(.dark) .staff-admin .text-primary-foreground {
  color: ${buttonText} !important;
}
.dark .staff-admin {
  --brand: #ffffff;
  --nav-inactive: #a1a1aa;
  --nav-heading: #71717a;
}
`;

  return <style dangerouslySetInnerHTML={{ __html: css }} />;
}

/** Same shell as the original admin backend UI. */
export function AdminShell({ children }: { children: ReactNode }) {
  const collapsed = useSyncExternalStore(subscribeCollapsed, getCollapsed, () => false);
  const { data } = useSession();
  const user = data?.user ?? null;
  const [mobileOpen, setMobileOpen] = useState(false);
  const { settings } = useStoreBrand();

  function toggleCollapsed() {
    window.localStorage.setItem(COLLAPSE_KEY, collapsed ? "0" : "1");
    window.dispatchEvent(new Event(COLLAPSE_EVENT));
  }

  const primary = settings.branding?.primaryColor || BRAND_NAVY;
  const sidebar = settings.branding?.sidebarColor || DEFAULT_SIDEBAR;
  const navInactive = settings.branding?.navInactiveColor || DEFAULT_NAV_INACTIVE;
  const navHeading = settings.branding?.navHeadingColor || DEFAULT_NAV_HEADING;
  const buttonBg = settings.branding?.buttonBgColor || DEFAULT_BUTTON_BG;
  const buttonText = settings.branding?.buttonTextColor || DEFAULT_BUTTON_TEXT;
  const headerColor = settings.branding?.headerColor || DEFAULT_HEADER;

  return (
    <UnreadOrdersProvider>
      <div className="flex min-h-svh bg-background">
      <BrandThemeStyles
        primary={primary}
        sidebar={sidebar}
        navInactive={navInactive}
        navHeading={navHeading}
        buttonBg={buttonBg}
        buttonText={buttonText}
      />
      <NavigationProgress />
      <aside
        className={cn(
          "admin-sidebar sticky top-0 hidden h-svh min-h-0 shrink-0 overflow-hidden border-r border-sidebar-border bg-sidebar text-sidebar-foreground transition-[width] duration-200 md:block",
          collapsed ? "w-14" : "w-60",
        )}
      >
        <Sidebar collapsed={collapsed} />
      </aside>
      <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
        <SheetContent
          side="left"
          className="h-full min-h-0 w-60 gap-0 overflow-hidden border-sidebar-border bg-sidebar p-0 text-sidebar-foreground"
          showCloseButton={false}
        >
          <Sidebar collapsed={false} onNavigate={() => setMobileOpen(false)} />
        </SheetContent>
      </Sheet>
      <div className="flex min-w-0 flex-1 flex-col">
        <Header
          user={user}
          headerColor={headerColor}
          onMenuClick={() => setMobileOpen(true)}
          onToggleCollapsed={toggleCollapsed}
        />
        <main className="admin-main min-w-0 max-w-full flex-1 overflow-x-clip bg-background px-4 py-6 lg:px-6">
          {children}
        </main>
      </div>
      </div>
    </UnreadOrdersProvider>
  );
}
