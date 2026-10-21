"use client";

import Link from "next/link";
import { useParams } from "next/navigation";

import { DetailCard } from "@/components/shared/detail-card";
import { DetailRow } from "@/components/shared/detail-row";
import { ErrorState } from "@/components/shared/error-state";
import { LoadingState } from "@/components/shared/loading-state";
import { OrderStatusBadge } from "@/components/shared/order-status-badge";
import { PageHeader } from "@/components/shared/page-header";
import { PaymentStatusBadge } from "@/components/shared/payment-status-badge";
import { StatusBadge } from "@/components/shared/status-badge";
import { useAsyncData } from "@/hooks/use-async-data";
import { formatCurrency, formatDate } from "@/lib/format";
import { getCustomer } from "@/services/customers";
import { listOrdersByCustomer } from "@/services/orders";

export default function CustomerDetailPage() {
  const params = useParams<{ id: string }>();
  const customer = useAsyncData(() => getCustomer(params.id), params.id);
  const orders = useAsyncData(() => listOrdersByCustomer(params.id), params.id);

  if (customer.loading) return <LoadingState />;
  if (!customer.data) return <ErrorState title="Customer not found" />;

  const c = customer.data;
  const address = c.addresses[0];

  return (
    <div className="space-y-6">
      <PageHeader
        title={`${c.firstName} ${c.lastName}`}
        description={c.email}
        actions={<StatusBadge status={c.status} />}
      />
      <div className="grid gap-6 lg:grid-cols-3">
        <DetailCard title="Profile">
          <DetailRow label="Name" value={`${c.firstName} ${c.lastName}`} />
          <DetailRow label="Email" value={c.email} />
          <DetailRow label="Phone" value={c.phone} />
          <DetailRow label="Joined" value={formatDate(c.createdAt)} />
          <DetailRow label="Notes" value={c.notes ?? "—"} />
        </DetailCard>
        <DetailCard title="Address">
          {address ? (
            <>
              <DetailRow label="Line 1" value={address.line1} />
              <DetailRow label="Line 2" value={address.line2 ?? "—"} />
              <DetailRow label="City" value={address.city} />
              <DetailRow label="Region" value={`${address.state} ${address.postalCode}`} />
              <DetailRow label="Country" value={address.country} />
            </>
          ) : (
            <p className="text-sm text-muted-foreground">No address on file.</p>
          )}
        </DetailCard>
        <DetailCard title="Totals">
          <DetailRow label="Orders" value={c.orderCount} />
          <DetailRow label="Total spent" value={formatCurrency(c.totalSpent)} />
        </DetailCard>
      </div>
      <DetailCard title="Order history">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="text-left text-muted-foreground">
              <tr>
                <th className="pb-2 font-medium">Order</th>
                <th className="pb-2 font-medium">Date</th>
                <th className="pb-2 font-medium">Total</th>
                <th className="pb-2 font-medium">Payment</th>
                <th className="pb-2 font-medium">Status</th>
              </tr>
            </thead>
            <tbody>
              {(orders.data ?? []).map((order) => (
                <tr key={order.id} className="border-t">
                  <td className="py-2.5">
                    <Link href={`/admin/orders/${order.id}`} className="font-medium hover:underline">
                      {order.number}
                    </Link>
                  </td>
                  <td className="py-2.5">{formatDate(order.createdAt)}</td>
                  <td className="py-2.5">{formatCurrency(order.total)}</td>
                  <td className="py-2.5">
                    <PaymentStatusBadge status={order.paymentStatus} />
                  </td>
                  <td className="py-2.5">
                    <OrderStatusBadge status={order.fulfillmentStatus} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </DetailCard>
    </div>
  );
}
