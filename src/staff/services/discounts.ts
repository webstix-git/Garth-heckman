export type Discount = {
  id: string;
  name: string;
  discount_type: "percent" | "amount" | "shipping";
  value: number;
  status: string;
  starts_at: string;
  ends_at: string | null;
  minimum_order_cents: number | null;
  maximum_discount_cents: number | null;
  usage_limit: number | null;
  customer_usage_limit: number | null;
  stackable: boolean;
  created_at: string;
  coupons?: Array<{ code: string; status: string }>;
};

async function json<T>(response: Response): Promise<T> {
  const data = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error((data as { error?: string }).error || "Discount request failed");
  return data as T;
}

export async function listDiscounts() {
  return json<{ data: Discount[] }>(await fetch("/api/staff/discounts", { cache: "no-store" }));
}

export type CreateDiscountInput = {
  name: string; discountType: "percent" | "amount" | "shipping"; value: number; code?: string;
  startsAt?: string; endsAt?: string; minimumOrderCents?: number; maximumDiscountCents?: number;
  usageLimit?: number; customerUsageLimit?: number; stackable?: boolean; status?: "active" | "disabled";
};

export async function createDiscount(input: CreateDiscountInput) {
  return json<{ data: Discount }>(await fetch("/api/staff/discounts", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(input) }));
}

