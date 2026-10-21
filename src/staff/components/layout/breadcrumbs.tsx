"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useMemo } from "react";

import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { titleCase } from "@/lib/format";

const LABELS: Record<string, string> = {
  dashboard: "Dashboard",
  products: "Products",
  new: "Create",
  edit: "Edit",
  categories: "Categories",
  orders: "Orders",
  customers: "Customers",
  blog: "Blog",
  "contact-submissions": "Contact Submissions",
  printify: "Printify",
  logs: "Sync Logs",
  media: "Media",
  settings: "Settings",
  profile: "Admin Profile",
};

export function Breadcrumbs() {
  const pathname = usePathname();
  const crumbs = useMemo(() => {
    const parts = pathname.split("/").filter(Boolean);
    // Drop the /admin URL prefix from the trail — Home already points at the dashboard.
    const trail = parts[0] === "admin" ? parts.slice(1) : parts;
    return trail.map((part, index) => {
      const hrefParts = parts[0] === "admin" ? ["admin", ...trail.slice(0, index + 1)] : trail.slice(0, index + 1);
      const href = "/" + hrefParts.join("/");
      const isLast = index === trail.length - 1;
      const looksLikeId = part.includes("_") || /^[a-z0-9-]{8,}$/i.test(part);
      const label = LABELS[part] ?? (looksLikeId ? "Detail" : titleCase(part));
      return { href, label, isLast };
    });
  }, [pathname]);

  if (crumbs.length === 0) return null;

  return (
    <Breadcrumb>
      <BreadcrumbList className="flex-wrap text-xs sm:text-sm">
        <BreadcrumbItem>
          <BreadcrumbLink render={<Link href="/admin/dashboard" />}>Home</BreadcrumbLink>
        </BreadcrumbItem>
        {crumbs.map((crumb) => (
          <span key={crumb.href} className="contents">
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              {crumb.isLast ? (
                <BreadcrumbPage>{crumb.label}</BreadcrumbPage>
              ) : (
                <BreadcrumbLink render={<Link href={crumb.href} />}>
                  {crumb.label}
                </BreadcrumbLink>
              )}
            </BreadcrumbItem>
          </span>
        ))}
      </BreadcrumbList>
    </Breadcrumb>
  );
}
