"use client";

import { format } from "date-fns";
import {
  ArrowUpRight,
  DollarSign,
  Mail,
  Plus,
  ShoppingCart,
  Users,
} from "lucide-react";
import Link from "next/link";

import { useSession } from "@/components/providers/session-provider";
import { DASHBOARD_MAX_DATE } from "@/components/dashboard/date-filter";
import { OrdersOverviewCard } from "@/components/dashboard/orders-overview";
import { BestSellingProductsCard } from "@/components/dashboard/best-selling-products";
import { SalesOverviewCard } from "@/components/dashboard/sales-overview";
import { ErrorState } from "@/components/shared/error-state";
import { CardSkeletonGrid } from "@/components/shared/loading-state";
import { OrderStatusBadge } from "@/components/shared/order-status-badge";
import { PageHeader } from "@/components/shared/page-header";
import { PaymentStatusBadge } from "@/components/shared/payment-status-badge";
import { SectionCard } from "@/components/shared/section-card";
import { StatsCard } from "@/components/shared/stats-card";
import { StatusBadge } from "@/components/shared/status-badge";
import { Button } from "@/components/ui/button";
import { useAsyncData } from "@/hooks/use-async-data";
import { formatCurrency, formatDate, formatNumber } from "@/lib/format";
import { mailtoHref } from "@/lib/links";
import {
  getDashboardStats,
  getOrderStatusOverview,
  getRecentOrders,
  getRecentSubmissions,
} from "@/services/dashboard";

export default function DashboardPage() {
  const { data: session } = useSession();
  const firstName = session?.user?.username || session?.user?.name || "Admin";
  const asOf = DASHBOARD_MAX_DATE;
  const asOfIso = format(asOf, "yyyy-MM-dd");
  const stats = useAsyncData(() => getDashboardStats(asOfIso), asOfIso);
  const statuses = useAsyncData(() => getOrderStatusOverview(asOfIso), asOfIso);
  const recentOrders = useAsyncData(() => getRecentOrders(5, asOfIso), asOfIso);
  const recentContacts = useAsyncData(() => getRecentSubmissions(10, asOfIso), asOfIso);

  const loading =
    stats.loading || statuses.loading || recentOrders.loading || recentContacts.loading;
  const error =
    stats.error || statuses.error || recentOrders.error || recentContacts.error;

  if (error) {
    return (
      <ErrorState
        description={error}
        onRetry={() => {
          void stats.reload();
          void statuses.reload();
          void recentOrders.reload();
          void recentContacts.reload();
        }}
      />
    );
  }

  return (
    <div className="-mx-4 -my-6 min-h-[calc(100vh-3.5rem)] space-y-6 bg-[#f6f6f7] px-4 py-6 lg:-mx-6 lg:px-6">
      <PageHeader
        title={`Welcome Back ${firstName} 👋`}
      />

      <div>
        <section className="overflow-hidden rounded-xl border bg-card shadow-sm">
          <div className="flex flex-col gap-4 p-5 sm:flex-row sm:items-center sm:justify-between sm:p-6">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.14em] text-muted-foreground">
                Store overview
              </p>
              <h2 className="mt-1 text-xl font-semibold tracking-tight">Keep your store moving</h2>
              <p className="mt-1 max-w-xl text-sm text-muted-foreground">
                Review sales, update your catalog, and stay on top of fulfillment from one place.
              </p>
            </div>
            <div className="flex shrink-0 flex-wrap gap-2">
              <Button size="sm" render={<Link href="/admin/products/new" />}>
                <Plus /> Add product
              </Button>
              <Button size="sm" variant="outline" render={<Link href="/admin/orders" />}>
                View orders <ArrowUpRight />
              </Button>
            </div>
          </div>
        </section>
      </div>

      {loading && !stats.data ? (
        <CardSkeletonGrid />
      ) : stats.data ? (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <StatsCard
            label="Total Orders"
            value={formatNumber(stats.data.orders)}
            icon={ShoppingCart}
            tone="emerald"
            href="/admin/orders"
            linkLabel="View all orders"
          />
          <StatsCard
            label="Total Customers"
            value={formatNumber(stats.data.customers)}
            icon={Users}
            tone="violet"
            href="/admin/customers"
            linkLabel="See all customers"
          />
          <StatsCard
            label="Contact Submissions"
            value={formatNumber(stats.data.contactSubmissions)}
            icon={Mail}
            tone="blue"
            href="/admin/contact-submissions"
            linkLabel="Open inbox"
          />
          <StatsCard
            label="Total Revenue"
            value={formatCurrency(stats.data.revenue)}
            icon={DollarSign}
            tone="emerald"
            href="/admin/orders"
            linkLabel="View paid orders"
          />
        </div>
      ) : null}

      <div className="grid gap-4 xl:grid-cols-3">
        <SalesOverviewCard asOf={asOf} />
        <OrdersOverviewCard data={statuses.data ?? []} />
      </div>

      <SectionCard
        title="Recent orders"
        contentClassName="p-0"
        action={
          <Button variant="ghost" size="sm" render={<Link href="/admin/orders" />}>
            View all
          </Button>
        }
      >
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-muted/30 text-left text-muted-foreground">
              <tr className="border-b">
                <th className="px-4 py-2 font-medium">Order</th>
                <th className="px-4 py-2 font-medium">Customer</th>
                <th className="px-4 py-2 font-medium">Total</th>
                <th className="px-4 py-2 font-medium">Payment</th>
                <th className="px-4 py-2 font-medium">Status</th>
              </tr>
            </thead>
            <tbody>
              {(recentOrders.data ?? []).map((order) => (
                <tr key={order.id} className="border-b last:border-0 odd:bg-muted/25 hover:bg-muted/40">
                  <td className="px-4 py-2.5">
                    <Link href={`/admin/orders/${order.id}`} className="font-medium hover:underline">
                      {order.number}
                    </Link>
                    <div className="text-xs text-muted-foreground">
                      {formatDate(order.createdAt)}
                    </div>
                  </td>
                  <td className="px-4 py-2.5">{order.customerName}</td>
                  <td className="px-4 py-2.5 tabular-nums">{formatCurrency(order.total)}</td>
                  <td className="px-4 py-2.5">
                    <PaymentStatusBadge status={order.paymentStatus} />
                  </td>
                  <td className="px-4 py-2.5">
                    <OrderStatusBadge status={order.fulfillmentStatus} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </SectionCard>

      <div className="grid min-w-0 gap-4 xl:grid-cols-[minmax(0,0.82fr)_minmax(0,1.18fr)]">
        <BestSellingProductsCard asOf={asOf} />
        <SectionCard
          title="Recent contact submissions"
          className="min-w-0"
          contentClassName="p-0"
          action={
            <Button variant="ghost" size="sm" render={<Link href="/admin/contact-submissions" />}>
              Inbox
            </Button>
          }
        >
          <div className="max-h-[280px] overflow-auto">
            <table className="w-full table-fixed text-sm">
              <thead className="sticky top-0 z-10 bg-muted text-left text-muted-foreground">
                <tr className="border-b">
                  <th className="w-[28%] px-4 py-2 font-medium">From</th>
                  <th className="w-[36%] px-4 py-2 font-medium">Subject</th>
                  <th className="w-[16%] px-4 py-2 font-medium">Status</th>
                  <th className="w-[20%] px-4 py-2 font-medium">Date</th>
                </tr>
              </thead>
              <tbody>
                {(recentContacts.data ?? []).map((row) => (
                  <tr key={row.id} className="border-b last:border-0 odd:bg-muted/25 hover:bg-muted/40">
                    <td className="px-4 py-2.5">
                      <Link href={`/admin/contact-submissions/${row.id}`} className="block truncate font-medium hover:underline">
                        {row.name}
                      </Link>
                      <a
                        href={mailtoHref(row.email)}
                        className="block truncate text-xs text-muted-foreground hover:underline"
                        onClick={(e) => e.stopPropagation()}
                      >
                        {row.email}
                      </a>
                    </td>
                    <td className="truncate px-4 py-2.5">{row.subject}</td>
                    <td className="px-4 py-2.5">
                      <StatusBadge status={row.status} />
                    </td>
                    <td className="truncate px-4 py-2.5 text-muted-foreground">
                      {formatDate(row.createdAt)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </SectionCard>
      </div>
    </div>
  );
}
