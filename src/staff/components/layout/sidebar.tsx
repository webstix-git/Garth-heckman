"use client";

import { ChevronDown, Store } from "lucide-react";
import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import { Suspense, useId, useMemo, useState } from "react";

import { NavPendingMark } from "@/components/layout/nav-pending-mark";
import { useUnreadOrders } from "@/components/providers/unread-orders-provider";
import { CountBadge } from "@/components/shared/count-badge";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import {
  collectOpenGroupKeys,
  isNavItemActive,
  NAV_SECTIONS,
  navItemKey,
  type NavItem,
} from "@/config/nav";
import { cn } from "@/lib/utils";

interface SidebarProps {
  collapsed: boolean;
  onNavigate?: () => void;
}

function AdminBrand({ collapsed }: { collapsed: boolean }) {
  return (
    <div className={cn("flex min-w-0 items-center", collapsed ? "justify-center" : "gap-2.5")}>
      <span className="flex size-9 shrink-0 items-center justify-center rounded-md bg-white text-black">
        <Store className="size-[19px]" strokeWidth={1.9} aria-hidden="true" />
      </span>
      {!collapsed ? (
        <div className="min-w-0">
          <p className="truncate text-[15px] leading-tight font-semibold text-white">Commerce Admin</p>
          <p className="mt-0.5 truncate text-[11px] leading-tight text-white/60">eCommerce backend</p>
        </div>
      ) : null}
    </div>
  );
}

export function Sidebar({ collapsed, onNavigate }: SidebarProps) {
  return (
    <Suspense fallback={<SidebarFallback collapsed={collapsed} />}>
      <SidebarNav collapsed={collapsed} onNavigate={onNavigate} />
    </Suspense>
  );
}

function navRowClass(active: boolean, isSubmenu = false) {
  return cn(
    "relative flex h-8 items-center gap-2.5 text-[13px] outline-none transition-colors focus-visible:ring-2 focus-visible:ring-zinc-400/50",
    isSubmenu ? "mx-2 rounded-md px-3.5" : "border-l-[3px] px-5",
    active && isSubmenu &&
      "bg-transparent font-semibold text-[var(--brand)] hover:bg-transparent hover:text-[var(--brand)]",
    active && !isSubmenu &&
      "border-transparent bg-transparent font-bold text-[var(--brand)] hover:bg-transparent hover:text-[var(--brand)]",
    !active && isSubmenu &&
      "font-normal text-[var(--nav-inactive)] hover:bg-white/12 hover:text-white",
    !active && !isSubmenu &&
      "border-transparent font-normal text-[var(--nav-inactive)] hover:bg-white/10 hover:text-white",
  );
}

function SidebarFallback({ collapsed }: { collapsed: boolean }) {
  return (
    <div className="flex h-full min-h-0 flex-col overflow-hidden bg-sidebar text-sidebar-foreground">
      <div className={cn("flex h-14 shrink-0 items-center", collapsed ? "justify-center" : "px-3")}>
      <div className={cn("flex items-center", collapsed ? "justify-center" : "px-3")}>
        <AdminBrand collapsed={collapsed} />
      </div>
      </div>
    </div>
  );
}

function SidebarNav({ collapsed, onNavigate }: SidebarProps) {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const search = searchParams.toString();
  const { unreadCount } = useUnreadOrders();
  const sections = useMemo(
    () =>
      NAV_SECTIONS.map((section) => ({
        ...section,
        items: section.items.map((item) =>
          item.href === "/admin/orders" && unreadCount > 0
            ? { ...item, badge: unreadCount > 99 ? "99+" : unreadCount }
            : item.href === "/admin/orders"
              ? { ...item, badge: undefined }
              : item,
        ),
      })),
    [unreadCount],
  );
  const autoOpenKeys = useMemo(
    () => new Set(sections.flatMap((section) => collectOpenGroupKeys(section.items, pathname, search))),
    [sections, pathname, search],
  );
  const [manualOpen, setManualOpen] = useState<Record<string, boolean>>({});

  function isGroupOpen(item: NavItem) {
    const key = navItemKey(item);
    if (key in manualOpen) return manualOpen[key];
    if (autoOpenKeys.has(key)) return true;
    return false;
  }

  function toggleGroup(item: NavItem) {
    const key = navItemKey(item);
    setManualOpen((current) => ({ ...current, [key]: !isGroupOpen(item) }));
  }

  const allItems = sections.flatMap((section) => section.items);

  return (
    <div className="flex h-full min-h-0 flex-col overflow-hidden bg-sidebar text-sidebar-foreground">
      <div className={cn("flex h-14 shrink-0 items-center", collapsed ? "justify-center" : "px-3")}>
      <div className={cn("flex items-center", collapsed ? "justify-center" : "px-3")}>
        <AdminBrand collapsed={collapsed} />
      </div>
      </div>
      <nav
        aria-label="Admin"
        className="min-h-0 flex-1 overflow-y-auto overscroll-contain py-2 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
      >
        <div className="grid gap-1">
          {allItems.map((item) => (
            <NavNode
              key={navItemKey(item)}
              item={item}
              siblings={allItems}
              depth={0}
              collapsed={collapsed}
              pathname={pathname}
              search={search}
              isGroupOpen={isGroupOpen}
              onToggleGroup={toggleGroup}
              onNavigate={onNavigate}
            />
          ))}
        </div>
      </nav>
    </div>
  );
}

function NavNode({
  item,
  siblings,
  depth,
  collapsed,
  pathname,
  search,
  isGroupOpen,
  onToggleGroup,
  onNavigate,
}: {
  item: NavItem;
  siblings: NavItem[];
  depth: number;
  collapsed: boolean;
  pathname: string;
  search: string;
  isGroupOpen: (item: NavItem) => boolean;
  onToggleGroup: (item: NavItem) => void;
  onNavigate?: () => void;
}) {
  const hasChildren = Boolean(item.children?.length);
  const active = isNavItemActive(item, pathname, search, siblings);

  if (item.disabled) {
    return <NavDisabled item={item} depth={depth} collapsed={collapsed} />;
  }

  if (collapsed && depth === 0) {
    return hasChildren ? (
      <CollapsedGroup item={item} active={active} pathname={pathname} search={search} onNavigate={onNavigate} />
    ) : (
      <CollapsedLink item={item} active={active} onNavigate={onNavigate} />
    );
  }

  if (hasChildren) {
    return (
      <NavGroup
        item={item}
        depth={depth}
        open={isGroupOpen(item)}
        active={active}
        pathname={pathname}
        search={search}
        onToggle={() => onToggleGroup(item)}
        isGroupOpen={isGroupOpen}
        onToggleGroup={onToggleGroup}
        onNavigate={onNavigate}
      />
    );
  }

  return <NavLink item={item} depth={depth} active={active} onNavigate={onNavigate} />;
}

function NavDisabled({
  item,
  depth,
  collapsed,
}: {
  item: NavItem;
  depth: number;
  collapsed: boolean;
}) {
  const Icon = item.icon;
  return (
    <div
      aria-disabled="true"
      title={collapsed ? `${item.title} (coming soon)` : undefined}
      className={cn(
        navRowClass(false, depth > 0),
        "cursor-not-allowed opacity-55",
        collapsed && depth === 0 && "justify-center px-0",
      )}
    >
      {depth === 0 && Icon ? <Icon className="size-4 shrink-0" strokeWidth={1.8} /> : null}
      {!collapsed || depth > 0 ? <span className="min-w-0 truncate">{item.title}</span> : null}
      {!collapsed && depth === 0 ? (
        <span className="ml-auto text-[10px] font-medium uppercase tracking-wide text-muted-foreground">Soon</span>
      ) : null}
    </div>
  );
}

function NavBadge({ value, compact, flush }: { value: string | number; compact?: boolean; flush?: boolean }) {
  return (
    <CountBadge
      value={value}
      compact={compact}
      className={compact || flush ? undefined : "ml-auto"}
    />
  );
}

function NavLink({
  item,
  depth,
  active,
  onNavigate,
}: {
  item: NavItem;
  depth: number;
  active: boolean;
  onNavigate?: () => void;
}) {
  const Icon = item.icon;
  return (
    <Link
      href={item.href ?? "#"}
      onClick={onNavigate}
      aria-current={active ? "page" : undefined}
      className={cn(
        navRowClass(active, depth > 0),
        depth > 0
          ? "has-[[data-pending=true]]:font-bold has-[[data-pending=true]]:text-[var(--brand)] dark:has-[[data-pending=true]]:text-white"
          : "has-[[data-pending=true]]:border-[var(--brand)] has-[[data-pending=true]]:bg-[var(--brand)]/10 has-[[data-pending=true]]:font-bold has-[[data-pending=true]]:text-[var(--brand)] dark:has-[[data-pending=true]]:border-white dark:has-[[data-pending=true]]:bg-white/10 dark:has-[[data-pending=true]]:text-white",
      )}
    >
      {depth === 0 && Icon ? <Icon className="size-4 shrink-0" strokeWidth={1.8} /> : null}
      <span className="min-w-0 truncate">{item.title}</span>
      {item.badge != null ? <NavBadge value={item.badge} /> : null}
      <NavPendingMark />
    </Link>
  );
}

function NavGroup({
  item,
  depth,
  open,
  active,
  pathname,
  search,
  onToggle,
  isGroupOpen,
  onToggleGroup,
  onNavigate,
}: {
  item: NavItem;
  depth: number;
  open: boolean;
  active: boolean;
  pathname: string;
  search: string;
  onToggle: () => void;
  isGroupOpen: (item: NavItem) => boolean;
  onToggleGroup: (item: NavItem) => void;
  onNavigate?: () => void;
}) {
  const panelId = useId();
  const Icon = item.icon;
  const labelId = `${panelId}-label`;

  return (
    <div>
      <button
        type="button"
        id={labelId}
        aria-expanded={open}
        aria-controls={panelId}
        onClick={onToggle}
        className={cn("w-full", navRowClass(active))}
      >
        {depth === 0 && Icon ? <Icon className="size-4 shrink-0" strokeWidth={1.8} /> : null}
        <span className="min-w-0 truncate">{item.title}</span>
        <span className="ml-auto flex items-center gap-1.5">
          {item.badge != null ? <NavBadge value={item.badge} flush /> : null}
          <ChevronDown
            aria-hidden
            className={cn(
              "size-4 shrink-0 text-[var(--nav-inactive)] transition-transform duration-200 dark:text-zinc-500",
              open && "rotate-180",
            )}
          />
        </span>
      </button>
      <div
        className={cn(
          "grid transition-[grid-template-rows] duration-200 ease-out",
          open ? "grid-rows-[1fr]" : "grid-rows-[0fr]",
        )}
      >
        <div className="overflow-hidden">
          <ul
            id={panelId}
            role="list"
            aria-labelledby={labelId}
            className="relative mt-0.5 grid gap-0.5 py-0.5 pl-4"
          >
            {item.children?.map((child) => (
              <li key={navItemKey(child)}>
                <NavNode
                  item={child}
                  siblings={item.children ?? []}
                  depth={depth + 1}
                  collapsed={false}
                  pathname={pathname}
                  search={search}
                  isGroupOpen={isGroupOpen}
                  onToggleGroup={onToggleGroup}
                  onNavigate={onNavigate}
                />
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}

function CollapsedLink({
  item,
  active,
  onNavigate,
}: {
  item: NavItem;
  active: boolean;
  onNavigate?: () => void;
}) {
  const Icon = item.icon;
  return (
    <Tooltip>
      <TooltipTrigger
        render={
          <Link
            href={item.href ?? "#"}
            onClick={onNavigate}
            aria-label={item.title}
            aria-current={active ? "page" : undefined}
            className={cn(
              "relative flex size-9 items-center justify-center border-l-[3px] outline-none transition-colors focus-visible:ring-2 focus-visible:ring-zinc-400/50",
              active
                ? "border-transparent bg-transparent text-[var(--brand)]"
                : "border-transparent text-[var(--nav-inactive)] hover:bg-[var(--brand)]/10 hover:text-[var(--brand)]",
            )}
          />
        }
      >
        {Icon ? <Icon className="size-4" /> : null}
        {item.badge != null ? <NavBadge value={item.badge} compact /> : null}
        <NavPendingMark />
      </TooltipTrigger>
      <TooltipContent side="right">{item.title}</TooltipContent>
    </Tooltip>
  );
}

function CollapsedGroup({
  item,
  active,
  pathname,
  search,
  onNavigate,
}: {
  item: NavItem;
  active: boolean;
  pathname: string;
  search: string;
  onNavigate?: () => void;
}) {
  const Icon = item.icon;
  return (
    <Popover modal={false}>
      <PopoverTrigger
        openOnHover
        delay={80}
        closeDelay={120}
        aria-label={item.title}
        className={cn(
          "relative flex size-9 items-center justify-center border-l-[3px] outline-none transition-colors focus-visible:ring-2 focus-visible:ring-zinc-400/50",
          active
            ? "border-transparent bg-transparent text-[var(--brand)]"
            : "border-transparent text-[var(--nav-inactive)] hover:bg-[var(--brand)]/10 hover:text-[var(--brand)]",
        )}
      >
        {Icon ? <Icon className="size-4" /> : null}
        {item.badge != null ? <NavBadge value={item.badge} compact /> : null}
      </PopoverTrigger>
      <PopoverContent side="right" align="start" className="w-52 gap-0.5 p-1.5">
        <p className="px-2 py-1 text-[11px] font-medium tracking-wide text-muted-foreground uppercase">
          {item.title}
        </p>
        <ul role="list" aria-label={item.title} className="grid gap-0.5">
          {item.children?.map((child) => {
            const childActive = isNavItemActive(child, pathname, search, item.children);
            return (
              <li key={navItemKey(child)}>
                <Link
                  href={child.href ?? "#"}
                  onClick={onNavigate}
                  aria-current={childActive ? "page" : undefined}
                  className={cn(
                    "relative flex h-8 items-center px-2 text-[13px] text-popover-foreground/80 outline-none hover:bg-muted focus-visible:ring-2 focus-visible:ring-ring/50 has-[[data-pending=true]]:font-bold has-[[data-pending=true]]:text-[var(--brand)] dark:has-[[data-pending=true]]:text-white",
                    childActive && "font-bold text-[var(--brand)] dark:text-white",
                  )}
                >
                  {child.title}
                  {child.badge != null ? <CountBadge value={child.badge} className="ml-auto" /> : null}
                  <NavPendingMark />
                </Link>
              </li>
            );
          })}
        </ul>
      </PopoverContent>
    </Popover>
  );
}
