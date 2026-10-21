"use client";

import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { type ReactNode, useEffect, useState } from "react";
import { toast } from "sonner";

import { DeleteDialog } from "@/components/shared/delete-dialog";
import { ErrorState } from "@/components/shared/error-state";
import { LoadingState } from "@/components/shared/loading-state";
import { OrderStatusBadge } from "@/components/shared/order-status-badge";
import { PaymentStatusBadge } from "@/components/shared/payment-status-badge";
import { SectionCard } from "@/components/shared/section-card";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useAsyncData } from "@/hooks/use-async-data";
import { formatCurrency, formatDateTime, titleCase } from "@/lib/format";
import { cn } from "@/lib/utils";
import { deleteOrder, getOrder, updateOrderStatus } from "@/services/orders";
import { useUnreadOrders } from "@/components/providers/unread-orders-provider";
import { ORDER_STATUSES, type Address, type OrderStatus } from "@/types";

function Fact({
  label,
  value,
  muted,
}: {
  label: string;
  value: ReactNode;
  muted?: boolean;
}) {
  return (
    <div>
      <dt className="text-xs text-muted-foreground">{label}</dt>
      <dd className={cn("mt-0.5 text-sm font-medium wrap-break-word", muted && "font-normal text-muted-foreground")}>
        {value ?? "—"}
      </dd>
    </div>
  );
}

function addressesMatch(a: Address, b: Address) {
  return (
    a.name === b.name &&
    a.line1 === b.line1 &&
    (a.line2 ?? "") === (b.line2 ?? "") &&
    a.city === b.city &&
    a.state === b.state &&
    a.postalCode === b.postalCode &&
    a.country === b.country
  );
}

function AddressBlock({ label, address }: { label: string; address: Address }) {
  const hasAddress = Boolean(address.line1 || address.city || address.state || address.postalCode);
  return (
    <div>
      <p className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">{label}</p>
      {hasAddress ? (
        <>
          <p className="mt-2 text-sm font-medium">{address.name || "Recipient"}</p>
          <p className="mt-1 text-sm leading-6 text-muted-foreground">
            {address.line1}{address.line2 ? `, ${address.line2}` : null}<br />
            {[address.city, address.state, address.postalCode].filter(Boolean).join(", ")}<br />
            {address.country}
          </p>
        </>
      ) : (
        <p className="mt-2 text-sm text-muted-foreground">Address not provided for this order.</p>
      )}
    </div>
  );
}

export default function OrderDetailPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const order = useAsyncData(() => getOrder(params.id), params.id);
  const { markSeen } = useUnreadOrders();
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    if (params.id) markSeen(params.id);
  }, [params.id, markSeen]);

  if (order.loading) return <LoadingState />;
  if (!order.data) return <ErrorState title="Order not found" />;

  const o = order.data;
  const sameAddress = addressesMatch(o.billingAddress, o.shippingAddress);

  return (
    <div className="admin-page-shell">
      <div className="order-detail-page mx-auto max-w-[1440px] space-y-6">
      <div className="invoice-print-heading">
        <p>Garth Heckman</p>
        <h1>Invoice</h1>
      </div>
      <div className="space-y-4">
        <Button variant="ghost" size="sm" className="no-print -ml-2 text-muted-foreground" render={<Link href="/admin/orders" />}>
          Back to orders
        </Button>
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="font-heading text-3xl font-semibold tracking-tight">Order {o.number}</h1>
              <PaymentStatusBadge status={o.paymentStatus} />
              <OrderStatusBadge status={o.fulfillmentStatus} />
            </div>
            <p className="mt-2 text-sm text-muted-foreground">Placed {formatDateTime(o.createdAt)}</p>
          </div>
          <div className="no-print flex flex-wrap gap-2">
            <Button variant="outline" onClick={() => window.print()}>Print invoice</Button>
            <Button variant="outline" className="border-destructive/30 text-destructive hover:bg-destructive/10" onClick={() => setDeleteOpen(true)}>
              Delete order
            </Button>
          </div>
        </div>
      </div>

      <div className="grid overflow-hidden rounded-2xl border bg-card shadow-xs sm:grid-cols-3">
        <div className="p-5 sm:border-r">
          <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Order total</p>
          <p className="mt-2 text-2xl font-semibold tracking-tight tabular-nums">{formatCurrency(o.total)}</p>
          <p className="mt-1 text-xs text-muted-foreground">{o.items.length} {o.items.length === 1 ? "line item" : "line items"}</p>
        </div>
        <div className="border-t p-5 sm:border-t-0 sm:border-r">
          <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Payment method</p>
          <p className="mt-2 text-base font-semibold">{titleCase(o.paymentMethod)}</p>
          <p className="mt-1 text-xs text-muted-foreground">Payment is {titleCase(o.paymentStatus)}</p>
        </div>
        <div className="border-t p-5 sm:border-t-0">
          <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Customer</p>
          <p className="mt-2 truncate text-base font-semibold">{o.customerName}</p>
          <p className="mt-1 truncate text-xs text-muted-foreground">{o.customerEmail}</p>
        </div>
      </div>

      <div className="grid items-start gap-6 xl:grid-cols-[minmax(0,1fr)_360px]">
        <div className="min-w-0 space-y-6">
          <SectionCard title="Items" description="Products included in this order">
            <div className="overflow-hidden rounded-xl border">
              {o.items.map((item) => (
                <div
                  key={item.id}
                  className="grid grid-cols-[auto_minmax(0,1fr)] gap-3 border-b p-4 last:border-b-0 sm:grid-cols-[auto_minmax(0,1fr)_auto_auto] sm:items-center"
                >
                  {item.image ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={item.image} alt="" className="size-14 rounded-lg border object-cover" />
                  ) : (
                    <span className="size-14 rounded-lg bg-muted" aria-label="Product image unavailable" />
                  )}
                  <div className="min-w-0 flex-1">
                    <Link
                      href={`/admin/products/${item.productSlug || item.productId}/edit`}
                      className="truncate text-sm font-semibold hover:underline"
                    >
                      {item.productName}
                    </Link>
                    <p className="truncate text-xs text-muted-foreground">
                      {item.sku}
                      {item.variantLabel ? ` · ${item.variantLabel}` : ""}
                    </p>
                  </div>
                  <p className="col-start-2 text-sm text-muted-foreground tabular-nums sm:col-start-auto">
                    {item.quantity} × {formatCurrency(item.unitPrice)}
                  </p>
                  <p className="col-start-2 text-sm font-semibold tabular-nums sm:col-start-auto sm:w-24 sm:text-right">
                    {formatCurrency(item.unitPrice * item.quantity)}
                  </p>
                </div>
              ))}
            </div>
            <dl className="ml-auto mt-6 max-w-72 space-y-3 rounded-xl bg-muted/35 p-4 text-sm">
              <div className="flex justify-between gap-6">
                <dt className="text-muted-foreground">Subtotal</dt>
                <dd className="tabular-nums">{formatCurrency(o.subtotal)}</dd>
              </div>
              <div className="flex justify-between gap-6">
                <dt className="text-muted-foreground">Shipping</dt>
                <dd className="tabular-nums">{formatCurrency(o.shipping)}</dd>
              </div>
              <div className="flex justify-between gap-6">
                <dt className="text-muted-foreground">Tax</dt>
                <dd className="tabular-nums">{formatCurrency(o.tax)}</dd>
              </div>
              <div className="flex justify-between gap-6 border-t pt-3 text-base font-semibold">
                <dt>Total</dt>
                <dd className="tabular-nums">{formatCurrency(o.total)}</dd>
              </div>
            </dl>
          </SectionCard>

          <div className="no-print">
          <SectionCard title="Timeline" description="Order activity and status history">
            <ol className="relative">
              {o.timeline.map((event, index) => (
                <li key={event.id} className="relative pb-5 pl-6 last:pb-0">
                  <span className="absolute top-1.5 left-0 size-2.5 rounded-full bg-[#5c3758]" />
                  {index < o.timeline.length - 1 ? (
                    <span className="absolute top-4 bottom-0 left-[4px] w-px bg-border" />
                  ) : null}
                  <p className="text-sm font-medium">{event.title}</p>
                  {event.description ? (
                    <p className="mt-0.5 text-xs text-muted-foreground">{event.description}</p>
                  ) : null}
                  <p className="mt-0.5 text-xs text-muted-foreground">{formatDateTime(event.at)}</p>
                </li>
              ))}
            </ol>
          </SectionCard>
          </div>
        </div>

        <aside className="space-y-6 xl:sticky xl:top-[calc(var(--admin-header-height)+1.5rem)]">
          <div className="no-print">
          <SectionCard title="Status" description="Payment and fulfillment controls">
            <div className="grid gap-4">
              <div className="flex items-center justify-between gap-3 rounded-lg bg-muted/40 px-3 py-2.5">
                <span className="text-xs text-muted-foreground">Payment</span>
                <PaymentStatusBadge status={o.paymentStatus} />
              </div>
              <div className="flex items-center justify-between gap-3 rounded-lg bg-muted/40 px-3 py-2.5">
                <span className="text-xs text-muted-foreground">Fulfillment</span>
                <OrderStatusBadge status={o.fulfillmentStatus} />
              </div>
              <div>
                <label className="mb-2 block text-xs font-medium text-muted-foreground">Update fulfillment status</label>
                <Select
                value={o.fulfillmentStatus}
                onValueChange={async (value) => {
                  if (!value) return;
                  const next = await updateOrderStatus(o.id, String(value) as OrderStatus);
                  order.setData(next);
                  toast.success("Fulfillment status updated");
                }}
                >
                <SelectTrigger className="w-full bg-background">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent alignItemWithTrigger={false}>
                  {ORDER_STATUSES.map((status) => (
                    <SelectItem key={status} value={status}>
                      {titleCase(status)}
                    </SelectItem>
                  ))}
                </SelectContent>
                </Select>
              </div>
            </div>
            <dl className="mt-4 space-y-3 border-t pt-4">
              <Fact label="Method" value={o.paymentMethod} />
              {o.printifyOrderId ? <Fact label="Printify ID" value={o.printifyOrderId} /> : null}
              {o.printifyFulfillmentStatus ? (
                <Fact label="Printify" value={titleCase(o.printifyFulfillmentStatus)} />
              ) : null}
              <Fact
                label="Tracking"
                muted={!o.trackingNumber}
                value={
                  o.trackingNumber && o.trackingUrl ? (
                    <a
                      href={o.trackingUrl}
                      className="hover:underline"
                      target="_blank"
                      rel="noreferrer"
                    >
                      {o.trackingNumber}
                    </a>
                  ) : (
                    o.trackingNumber ?? "None"
                  )
                }
              />
            </dl>
          </SectionCard>
          </div>

          <SectionCard title="Customer">
            <Link
              href={`/admin/customers/${encodeURIComponent(o.customerId)}`}
              className="text-sm font-medium hover:underline"
            >
              {o.customerName}
            </Link>
            <a
              href={`mailto:${o.customerEmail}`}
              className="mt-1 block text-sm text-muted-foreground hover:underline"
            >
              {o.customerEmail}
            </a>
          </SectionCard>

          <SectionCard title="Addresses">
            <div className="space-y-4">
              <AddressBlock label="Shipping" address={o.shippingAddress} />
              {sameAddress ? (
                <p className="text-xs text-muted-foreground">Billing is the same as shipping.</p>
              ) : (
                <AddressBlock label="Billing" address={o.billingAddress} />
              )}
            </div>
          </SectionCard>

          {o.notes ? (
            <SectionCard title="Notes">
              <p className="text-sm">{o.notes}</p>
            </SectionCard>
          ) : null}
        </aside>
      </div>

      <DeleteDialog
        open={deleteOpen}
        onOpenChange={setDeleteOpen}
        title="Delete order"
        description={`Delete order ${o.number}? This cannot be undone.`}
        loading={deleting}
        onConfirm={async () => {
          setDeleting(true);
          try {
            await deleteOrder(o.id);
            toast.success("Order deleted");
            router.push("/admin/orders");
          } catch (error) {
            toast.error(error instanceof Error ? error.message : "Could not delete order");
            setDeleting(false);
          }
        }}
      />
      </div>
    </div>
  );
}
