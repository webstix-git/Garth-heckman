"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

import { cn } from "@/lib/utils";

const TABS = [
  { href: "/admin/printify/products", label: "Products" },
  { href: "/admin/printify/orders", label: "Orders" },
  { href: "/admin/printify/logs", label: "Sync logs" },
];

export function PrintifyTabs() {
  const pathname = usePathname();
  return (
    <div className="flex flex-wrap gap-1 rounded-lg bg-muted p-1">
      {TABS.map((tab) => (
        <Link
          key={tab.href}
          href={tab.href}
          className={cn(
            "rounded-md px-3 py-1.5 text-sm text-muted-foreground hover:text-foreground",
            pathname === tab.href && "bg-background font-medium text-foreground shadow-sm",
          )}
        >
          {tab.label}
        </Link>
      ))}
    </div>
  );
}
