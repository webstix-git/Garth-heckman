"use client";

import { useEffect, useState } from "react";
import { PageHeader } from "@/components/shared/page-header";
import { SectionCard } from "@/components/shared/section-card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { createDiscount, listDiscounts, type Discount } from "@/services/discounts";

export default function DiscountsPage() {
  const [items, setItems] = useState<Discount[]>([]);
  const [message, setMessage] = useState("");
  const [form, setForm] = useState({ name: "", discountType: "percent" as "percent" | "amount" | "shipping", value: "10", code: "", endsAt: "", usageLimit: "" });
  async function reload() { try { const result = await listDiscounts(); setItems(result.data); } catch (error) { setMessage(error instanceof Error ? error.message : "Unable to load discounts"); } }
  useEffect(() => { void reload(); }, []);
  async function submit(event: React.FormEvent) { event.preventDefault(); setMessage(""); try { await createDiscount({ ...form, value: Number(form.value), usageLimit: form.usageLimit ? Number(form.usageLimit) : undefined, endsAt: form.endsAt || undefined }); setForm({ name: "", discountType: "percent", value: "10", code: "", endsAt: "", usageLimit: "" }); setMessage("Discount created."); await reload(); } catch (error) { setMessage(error instanceof Error ? error.message : "Unable to create discount"); } }
  return <div className="space-y-6"><PageHeader title="Discounts" description="Create store discounts and coupon codes." /><div className="grid gap-6 lg:grid-cols-[360px_1fr]"><SectionCard title="Create discount"><form className="space-y-4" onSubmit={submit}><div><Label>Name</Label><Input required value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} placeholder="Summer sale" /></div><div><Label>Type</Label><Select value={form.discountType} onValueChange={value => setForm({ ...form, discountType: value as typeof form.discountType })}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="percent">Percentage</SelectItem><SelectItem value="amount">Fixed amount</SelectItem><SelectItem value="shipping">Free shipping</SelectItem></SelectContent></Select></div><div><Label>{form.discountType === "percent" ? "Percentage" : "Value"}</Label><Input required type="number" min="0" max={form.discountType === "percent" ? 100 : undefined} value={form.value} onChange={e => setForm({ ...form, value: e.target.value })} /></div><div><Label>Coupon code (optional)</Label><Input value={form.code} onChange={e => setForm({ ...form, code: e.target.value.toUpperCase() })} placeholder="SUMMER10" /></div><div><Label>End date (optional)</Label><Input type="datetime-local" value={form.endsAt} onChange={e => setForm({ ...form, endsAt: e.target.value })} /></div><div><Label>Usage limit (optional)</Label><Input type="number" min="1" value={form.usageLimit} onChange={e => setForm({ ...form, usageLimit: e.target.value })} /></div><Button type="submit">Create discount</Button>{message && <p className="text-sm text-muted-foreground">{message}</p>}</form></SectionCard><SectionCard title="Discounts"><div className="space-y-3">{items.length === 0 ? <p className="text-sm text-muted-foreground">No discounts yet.</p> : items.map(item => <div key={item.id} className="flex flex-wrap items-center justify-between gap-3 rounded-lg border p-4"><div><p className="font-medium">{item.name}</p><p className="text-sm text-muted-foreground">{item.coupons?.[0]?.code || "Automatic discount"} · {item.discount_type === "percent" ? `${item.value}%` : item.discount_type === "shipping" ? "Free shipping" : `$${(item.value / 100).toFixed(2)}`}</p></div><span className="rounded-full border px-2 py-1 text-xs capitalize">{item.status}</span></div>)}</div></SectionCard></div></div>;
}
