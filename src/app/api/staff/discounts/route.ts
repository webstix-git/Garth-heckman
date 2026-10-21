import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { requireAdminContext } from "@/staff/lib/require-admin-context";
import { recordAuditEvent } from "@/staff/lib/audit-log";

export const runtime = "nodejs";

function cleanText(value: unknown, max = 120) {
  return typeof value === "string" ? value.trim().slice(0, max) : "";
}

export async function GET() {
  try {
    const context = await requireAdminContext();
    const { data, error } = await createAdminClient()
      .from("discounts")
      .select("id,name,discount_type,value,status,starts_at,ends_at,minimum_order_cents,maximum_discount_cents,usage_limit,customer_usage_limit,stackable,created_at,coupons(code,status)")
      .eq("store_id", context.storeId)
      .order("created_at", { ascending: false });
    if (error) throw new Error(error.message);
    return NextResponse.json({ data: data ?? [] }, { headers: { "Cache-Control": "no-store" } });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Unable to load discounts" }, { status: 401 });
  }
}

export async function POST(request: Request) {
  try {
    const context = await requireAdminContext();
    const body = await request.json() as Record<string, unknown>;
    const name = cleanText(body.name);
    const type = cleanText(body.discountType, 20);
    const value = Number(body.value);
    if (!name || !["percent", "amount", "shipping"].includes(type)) {
      return NextResponse.json({ error: "Name and a valid discount type are required." }, { status: 400 });
    }
    if (!Number.isFinite(value) || value < 0 || (type === "percent" && value > 100)) {
      return NextResponse.json({ error: type === "percent" ? "Percentage must be between 0 and 100." : "Discount value must be zero or greater." }, { status: 400 });
    }
    const startsAt = cleanText(body.startsAt, 40) || new Date().toISOString();
    const endsAt = cleanText(body.endsAt, 40) || null;
    if (endsAt && Number.isNaN(Date.parse(endsAt))) return NextResponse.json({ error: "End date is invalid." }, { status: 400 });
    if (endsAt && new Date(endsAt) <= new Date(startsAt)) return NextResponse.json({ error: "End date must be after the start date." }, { status: 400 });
    const db = createAdminClient();
    const discount = await db.from("discounts").insert({
      store_id: context.storeId,
      name,
      discount_type: type,
      value: type === "amount" ? Math.round(value * 100) : Math.round(value),
      status: body.status === "disabled" ? "disabled" : "active",
      starts_at: startsAt,
      ends_at: endsAt,
      minimum_order_cents: body.minimumOrderCents ? Math.round(Number(body.minimumOrderCents) * 100) : null,
      maximum_discount_cents: body.maximumDiscountCents ? Math.round(Number(body.maximumDiscountCents) * 100) : null,
      usage_limit: body.usageLimit ? Math.round(Number(body.usageLimit)) : null,
      customer_usage_limit: body.customerUsageLimit ? Math.round(Number(body.customerUsageLimit)) : null,
      stackable: Boolean(body.stackable),
    }).select("id,name,discount_type,value,status,starts_at,ends_at,minimum_order_cents,maximum_discount_cents,usage_limit,customer_usage_limit,stackable,created_at").single();
    if (discount.error || !discount.data) throw new Error(discount.error?.message || "Unable to create discount.");
    const code = cleanText(body.code, 40).toUpperCase();
    if (code) {
      const coupon = await db.from("coupons").insert({ store_id: context.storeId, discount_id: discount.data.id, code, status: "active", starts_at: startsAt, expires_at: endsAt, usage_limit: body.usageLimit ? Math.round(Number(body.usageLimit)) : null });
      if (coupon.error) throw new Error(coupon.error.message);
    }
    await recordAuditEvent(context, "discount.created", "discount", discount.data.id, { code: code || null });
    return NextResponse.json({ data: discount.data }, { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Unable to create discount" }, { status: 400 });
  }
}

