"use client";

import { Bell, Clock3, ShoppingCart } from "lucide-react";
import Link from "next/link";

import { useUnreadOrders } from "@/components/providers/unread-orders-provider";
import { countBadgeClass } from "@/components/shared/count-badge";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { formatCurrency, formatDateTime } from "@/lib/format";
import { cn } from "@/lib/utils";

export function NotificationsPopover() {
  const { unreadCount, unreadOrders, markSeen, markAllSeen } = useUnreadOrders();
  const badge = unreadCount > 99 ? "99+" : unreadCount;

  return (
    <Popover>
      <PopoverTrigger
        render={
          <Button
            variant="ghost"
            size="icon"
            aria-label={unreadCount ? `${unreadCount} unread orders` : "Notifications"}
            className="relative overflow-visible text-white hover:bg-white/10 hover:text-white"
          />
        }
      >
        <Bell className="size-4 text-white" />
        {unreadCount > 0 ? (
          <span className="absolute -top-1 -right-1 z-10 flex h-[18px] min-w-[18px] items-center justify-center rounded-full bg-red-500 px-1 text-center text-[10px] font-bold leading-none text-white shadow-sm ring-2 ring-black/25">
            {badge}
          </span>
        ) : null}
      </PopoverTrigger>
      <PopoverContent
        align="end"
        sideOffset={8}
        className="w-[380px] gap-0 overflow-hidden rounded-xl p-0 shadow-[0_8px_30px_rgba(15,23,42,0.18)] ring-0"
      >
        <div className="bg-[var(--brand)] px-4 py-4 text-white dark:bg-zinc-900 dark:text-white">
          <div className="flex items-center justify-between gap-3">
            <p className="text-base font-semibold">Notifications</p>
            {unreadCount > 0 ? (
              <span className={cn(countBadgeClass, "h-[18px] min-w-[18px] px-1.5 text-[10px] leading-none")}>
                {badge} New
              </span>
            ) : null}
          </div>
          <p className="mt-1 text-xs text-white/75">New orders waiting to be reviewed</p>
        </div>

        <ul className="max-h-[360px] divide-y divide-border bg-background">
          {unreadOrders.map((order) => (
            <li key={order.id}>
              <Link
                href={order.href}
                onClick={() => markSeen(order.id)}
                className="flex items-start gap-3 px-4 py-3 transition-colors hover:bg-muted/50"
              >
                <span className="flex size-9 shrink-0 items-center justify-center rounded-full bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300">
                  <ShoppingCart className="size-4" />
                </span>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-semibold text-foreground">Order {order.number}</p>
                  <p className="text-sm leading-snug text-foreground/80">
                    {order.customerName} · {formatCurrency(order.total)}
                  </p>
                  <p className="mt-1.5 flex items-center gap-1.5 text-[10px] font-medium tracking-wide text-muted-foreground uppercase">
                    <Clock3 className="size-3" />
                    {formatDateTime(order.createdAt)}
                  </p>
                </div>
              </Link>
            </li>
          ))}
          {unreadOrders.length === 0 ? (
            <li className="px-4 py-8 text-center text-sm text-muted-foreground">
              No new orders.
            </li>
          ) : null}
        </ul>

        {unreadCount > 0 ? (
          <div className="flex items-center justify-between gap-2 border-t bg-muted/30 px-4 py-2.5">
            <Button variant="ghost" size="sm" render={<Link href="/admin/orders" />}>
              View all orders
            </Button>
            <Button variant="ghost" size="sm" onClick={markAllSeen}>
              Mark all read
            </Button>
          </div>
        ) : null}
      </PopoverContent>
    </Popover>
  );
}
