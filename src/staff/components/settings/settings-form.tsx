"use client";

import {
  ImagePlus,
  Loader2,
  X,
} from "lucide-react";
import { useTheme } from "next-themes";
import { useMemo, useRef, useState } from "react";
import { toast } from "sonner";

import { useStoreBrand } from "@/components/providers/store-brand-provider";
import { ErrorState } from "@/components/shared/error-state";
import { FormField } from "@/components/shared/form-field";
import { LoadingState } from "@/components/shared/loading-state";
import { PageHeader } from "@/components/shared/page-header";
import { SectionCard } from "@/components/shared/section-card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { useAsyncData } from "@/hooks/use-async-data";
import { getSettings, saveSettings } from "@/services/settings";
import { listProducts } from "@/services/products";
import type { StoreAddress, StoreSettings } from "@/types";

const CURRENCIES = [
  { value: "USD", label: "USD — US Dollar" },
  { value: "CAD", label: "CAD — Canadian Dollar" },
  { value: "GBP", label: "GBP — British Pound" },
  { value: "EUR", label: "EUR — Euro" },
];

const TIMEZONES = [
  { value: "America/Los_Angeles", label: "Pacific Time (Los Angeles)" },
  { value: "America/Denver", label: "Mountain Time (Denver)" },
  { value: "America/Chicago", label: "Central Time (Chicago)" },
  { value: "America/New_York", label: "Eastern Time (New York)" },
  { value: "UTC", label: "UTC" },
];

const SPOTLIGHT_NONE = "__none__";

function spotlightSelectValue(stored: string | null | undefined): string | undefined {
  if (stored === "") return SPOTLIGHT_NONE;
  if (stored == null) return undefined;
  return stored;
}

function spotlightStoredValue(selected: string): string | null {
  if (selected === SPOTLIGHT_NONE) return "";
  return selected;
}

export function SettingsForm({ section }: { section: "store" | "email" | "appearance" }) {
  const { resolvedTheme } = useTheme();
  const loaded = useAsyncData(() => getSettings());
  const products = useAsyncData(() =>
    listProducts({ status: "active", page: 1, pageSize: 200, sortBy: "name", sortDir: "asc" }),
  );
  const { applyLocal, reload } = useStoreBrand();
  const [draft, setDraft] = useState<StoreSettings | null>(null);
  const [saving, setSaving] = useState(false);
  const [uploadingLogo, setUploadingLogo] = useState(false);
  const logoInputRef = useRef<HTMLInputElement>(null);
  const form = draft ?? loaded.data;

  const productOptions = useMemo(() => products.data?.items ?? [], [products.data]);
  const productSelectItems = useMemo(
    () => [
      { value: SPOTLIGHT_NONE, label: "None — hide section" },
      ...productOptions.map((p) => ({
        value: p.id,
        label: `${p.name} (${p.sku})`,
      })),
    ],
    [productOptions],
  );

  if (loaded.loading || !form) return <LoadingState />;
  if (loaded.error) {
    return <ErrorState description={loaded.error} onRetry={() => void loaded.reload()} />;
  }

  function setForm(next: StoreSettings) {
    setDraft(next);
    applyLocal(next);
  }

  function patchStore(partial: Partial<StoreSettings["store"]>) {
    setForm({ ...form!, store: { ...form!.store, ...partial } });
  }

  function patchBranding(partial: Partial<StoreSettings["branding"]>) {
    setForm({
      ...form!,
      branding: {
        primaryColor: form!.branding?.primaryColor || "#5c3758",
        sidebarColor: form!.branding?.sidebarColor || "#f7f7f7",
        headerColor: form!.branding?.headerColor || "#000000",
        navInactiveColor: form!.branding?.navInactiveColor || "#52525b",
        navHeadingColor: form!.branding?.navHeadingColor || "#71717a",
        buttonBgColor: form!.branding?.buttonBgColor || "#5c3758",
        buttonTextColor: form!.branding?.buttonTextColor || "#ffffff",
        ...partial,
      },
    });
  }

  function patchStorefront(partial: Partial<StoreSettings["storefront"]>) {
    setForm({
      ...form!,
      storefront: {
        homeSpotlightProductId: form!.storefront?.homeSpotlightProductId ?? null,
        storeSpotlightProductId: form!.storefront?.storeSpotlightProductId ?? null,
        ...partial,
      },
    });
  }

  function patchSeo(partial: Partial<StoreSettings["seo"]>) {
    setForm({
      ...form!,
      seo: {
        noindex: form!.seo?.noindex ?? false,
        ...partial,
      },
    });
  }

  function patchAddress(partial: Partial<StoreAddress>) {
    setForm({
      ...form!,
      store: {
        ...form!.store,
        address: { ...(form!.store.address || {}), ...partial },
      },
    });
  }

  async function onSave() {
    setSaving(true);
    try {
      const payload: StoreSettings = {
        ...form!,
        storefront: {
          homeSpotlightProductId: form!.storefront?.homeSpotlightProductId ?? null,
          storeSpotlightProductId: form!.storefront?.storeSpotlightProductId ?? null,
        },
        seo: {
          noindex: form!.seo?.noindex ?? false,
        },
      };
      const next = await saveSettings(payload);
      setDraft(next);
      applyLocal(next);
      await reload();
      toast.success("Settings saved");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Could not save settings");
    } finally {
      setSaving(false);
    }
  }

  async function onUploadLogo(file: File | undefined) {
    if (!file) return;
    setUploadingLogo(true);
    try {
      const body = new FormData();
      body.append("file", file);
      const res = await fetch("/api/store/settings/logo", { method: "POST", body });
      const json = (await res.json().catch(() => ({}))) as {
        data?: { url?: string };
        error?: string;
      };
      if (!res.ok || !json.data?.url) {
        throw new Error(json.error || "Logo upload failed");
      }
      const withLogo = {
        ...form!,
        store: { ...form!.store, logoUrl: json.data.url },
      };
      setForm(withLogo);
      // Persist full settings so name/address stay in sync with the new logo.
      const saved = await saveSettings(withLogo);
      setDraft(saved);
      applyLocal(saved);
      await reload();
      toast.success("Logo uploaded and saved");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Logo upload failed");
    } finally {
      setUploadingLogo(false);
      if (logoInputRef.current) logoInputRef.current.value = "";
    }
  }

  const address = form.store.address || {
    line1: "",
    city: "",
    state: "",
    postalCode: "",
    country: "United States",
  };
  const showStore = section === "store" || section === "appearance";
  const isDarkTheme = resolvedTheme === "dark";
  const title =
    section === "email" ? "Email settings" : section === "appearance" ? "Appearance" : "Store settings";
  return (
    <div className="mx-auto max-w-6xl space-y-6 pb-10">
      <PageHeader
        title={title}
        actions={
          <Button className="min-w-32 shadow-sm" onClick={() => void onSave()} disabled={saving || uploadingLogo}>
            {saving ? <Loader2 className="size-4 animate-spin" /> : null}
            {saving ? "Saving" : "Save changes"}
          </Button>
        }
      />

      {showStore ? (
        <>
          <SectionCard title="Payment providers" description="Choose which payment buttons customers can use at checkout.">
            <div className="space-y-4">
              <div className="flex items-center justify-between gap-4 rounded-lg border p-4">
                <div><p className="font-medium">PayPal</p><p className="text-sm text-muted-foreground">Accept payments through PayPal Sandbox.</p></div>
                <Switch checked={form.payments?.paypalEnabled ?? true} onCheckedChange={(value) => setForm({ ...form!, payments: { paypalEnabled: value, venmoEnabled: form!.payments?.venmoEnabled ?? true, cashOnDeliveryEnabled: form!.payments?.cashOnDeliveryEnabled ?? false, mode: form!.payments?.mode ?? "sandbox" } })} />
              </div>
              <div className="flex items-center justify-between gap-4 rounded-lg border p-4">
                <div><p className="font-medium">Venmo</p><p className="text-sm text-muted-foreground">Show Venmo when it is eligible in PayPal Sandbox.</p></div>
                <Switch checked={form.payments?.venmoEnabled ?? true} onCheckedChange={(value) => setForm({ ...form!, payments: { paypalEnabled: form!.payments?.paypalEnabled ?? true, venmoEnabled: value, cashOnDeliveryEnabled: form!.payments?.cashOnDeliveryEnabled ?? false, mode: form!.payments?.mode ?? "sandbox" } })} />
              </div>
              <div className="flex items-center justify-between gap-4 rounded-lg border p-4">
                <div><p className="font-medium">Cash on delivery</p><p className="text-sm text-muted-foreground">Allow customers to pay when their order is delivered.</p></div>
                <Switch checked={form.payments?.cashOnDeliveryEnabled ?? false} onCheckedChange={(value) => setForm({ ...form!, payments: { paypalEnabled: form!.payments?.paypalEnabled ?? true, venmoEnabled: form!.payments?.venmoEnabled ?? true, cashOnDeliveryEnabled: value, mode: form!.payments?.mode ?? "sandbox" } })} />
              </div>
              <p className="text-xs text-muted-foreground">The PayPal secret stays on the server and is never sent to the browser.</p>
            </div>
          </SectionCard>
          <SectionCard title="Store identity">
            <div className="grid gap-4 sm:grid-cols-2">
              <FormField label="Project name" className="sm:col-span-2" required>
                <Input
                  value={form.store.name}
                  onChange={(e) => patchStore({ name: e.target.value })}
                  placeholder="Your store or project name"
                />
              </FormField>
              <FormField label="Tagline" className="sm:col-span-2">
                <Input
                  value={form.store.tagline}
                  onChange={(e) => patchStore({ tagline: e.target.value })}
                  placeholder="Admin Portal"
                />
              </FormField>
              <FormField label="Contact email">
                <Input
                  type="email"
                  value={form.store.email}
                  onChange={(e) => patchStore({ email: e.target.value })}
                />
              </FormField>
              <FormField label="Phone">
                <Input
                  type="tel"
                  value={form.store.phone}
                  onChange={(e) => patchStore({ phone: e.target.value })}
                />
              </FormField>
              <FormField label="Currency">
                <Select
                  value={form.store.currency}
                  onValueChange={(value) => {
                    if (value) patchStore({ currency: String(value) });
                  }}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent alignItemWithTrigger={false}>
                    {CURRENCIES.map((item) => (
                      <SelectItem key={item.value} value={item.value}>
                        {item.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </FormField>
              <FormField label="Timezone">
                <Select
                  value={form.store.timezone}
                  onValueChange={(value) => {
                    if (value) patchStore({ timezone: String(value) });
                  }}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent alignItemWithTrigger={false}>
                    {TIMEZONES.map((item) => (
                      <SelectItem key={item.value} value={item.value}>
                        {item.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </FormField>
            </div>
          </SectionCard>

          <SectionCard title="Featured products">
            <div className="grid gap-4 sm:grid-cols-2">
              <FormField label="Show on home page" hint="One product maximum">
                <Select
                  value={spotlightSelectValue(form.storefront?.homeSpotlightProductId)}
                  items={productSelectItems}
                  onValueChange={(value) => {
                    if (value == null) return;
                    patchStorefront({
                      homeSpotlightProductId: spotlightStoredValue(String(value)),
                    });
                  }}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Select product">
                      {(selected) =>
                        productSelectItems.find((item) => item.value === selected)?.label ??
                        "Select product"
                      }
                    </SelectValue>
                  </SelectTrigger>
                  <SelectContent alignItemWithTrigger={false}>
                    {productSelectItems.map((item) => (
                      <SelectItem key={item.value} value={item.value}>
                        {item.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </FormField>
                <FormField label="Show on store page" hint="One product maximum">
                <Select
                  value={spotlightSelectValue(form.storefront?.storeSpotlightProductId)}
                  items={productSelectItems}
                  onValueChange={(value) => {
                    if (value == null) return;
                    patchStorefront({
                      storeSpotlightProductId: spotlightStoredValue(String(value)),
                    });
                  }}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Select product">
                      {(selected) =>
                        productSelectItems.find((item) => item.value === selected)?.label ??
                        "Select product"
                      }
                    </SelectValue>
                  </SelectTrigger>
                  <SelectContent alignItemWithTrigger={false}>
                    {productSelectItems.map((item) => (
                      <SelectItem key={item.value} value={item.value}>
                        {item.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </FormField>
            </div>
          </SectionCard>

          <SectionCard title="Search visibility">
            <FormField
              label="Noindex site"
              hint="Ask search engines not to index pages across the storefront"
            >
              <div className="flex h-9 items-center">
                <Switch
                  checked={Boolean(form.seo?.noindex)}
                  onCheckedChange={(checked) => patchSeo({ noindex: checked })}
                />
              </div>
            </FormField>
          </SectionCard>

          <SectionCard title="Brand mark">
            <div className="grid gap-4 sm:grid-cols-[160px_1fr]">
              <div className="flex aspect-square items-center justify-center rounded-lg border bg-muted/40 p-3">
                {form.store.logoUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={form.store.logoUrl}
                    alt={form.store.name || "Logo"}
                    className="max-h-full max-w-full object-contain"
                  />
                ) : (
                  <span className="text-xs text-muted-foreground">No logo</span>
                )}
              </div>
              <div className="space-y-3">
                <p className="text-sm text-muted-foreground">
                  Upload a PNG, JPG, WEBP, or SVG (max 5MB).
                </p>
                <div className="flex flex-wrap gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    disabled={uploadingLogo}
                    onClick={() => logoInputRef.current?.click()}
                  >
                    {uploadingLogo ? <Loader2 className="size-4 animate-spin" /> : <ImagePlus className="size-4" />}
                    Upload logo
                  </Button>
                  {form.store.logoUrl ? (
                    <Button
                      type="button"
                      variant="ghost"
                      disabled={uploadingLogo}
                      onClick={() => patchStore({ logoUrl: "" })}
                    >
                      <X className="size-4" />
                      Remove
                    </Button>
                  ) : null}
                </div>
                <input
                  ref={logoInputRef}
                  type="file"
                  accept="image/png,image/jpeg,image/webp,image/gif,image/svg+xml"
                  className="sr-only"
                  onChange={(e) => void onUploadLogo(e.target.files?.[0])}
                />
              </div>
            </div>
          </SectionCard>

          <SectionCard title="Business address">
            <div className="grid gap-4 sm:grid-cols-2">
              <FormField label="Street address" className="sm:col-span-2">
                <Input
                  value={address.line1}
                  onChange={(e) => patchAddress({ line1: e.target.value })}
                />
              </FormField>
              <FormField label="Apt, suite" className="sm:col-span-2">
                <Input
                  value={address.line2 ?? ""}
                  onChange={(e) => patchAddress({ line2: e.target.value })}
                />
              </FormField>
              <FormField label="City">
                <Input
                  value={address.city}
                  onChange={(e) => patchAddress({ city: e.target.value })}
                />
              </FormField>
              <FormField label="State">
                <Input
                  value={address.state}
                  onChange={(e) => patchAddress({ state: e.target.value })}
                />
              </FormField>
              <FormField label="Postal code">
                <Input
                  value={address.postalCode}
                  onChange={(e) => patchAddress({ postalCode: e.target.value })}
                />
              </FormField>
              <FormField label="Country">
                <Input
                  value={address.country}
                  onChange={(e) => patchAddress({ country: e.target.value })}
                />
              </FormField>
            </div>
          </SectionCard>

          <SectionCard title="Brand colors">
            <fieldset disabled={isDarkTheme} className="grid gap-4 sm:grid-cols-2">
              <FormField
                label="Active menu color"
                hint="Selected items, badges, and links."
              >
                <div className="flex gap-2">
                  <Input
                    type="color"
                    className="h-9 w-14 cursor-pointer p-1"
                    value={form.branding?.primaryColor || "#5c3758"}
                    onChange={(e) => patchBranding({ primaryColor: e.target.value })}
                  />
                  <Input
                    value={form.branding?.primaryColor || "#5c3758"}
                    onChange={(e) => patchBranding({ primaryColor: e.target.value })}
                  />
                </div>
              </FormField>
              <FormField
                label="Menu text color"
                hint="Unselected menu items."
              >
                <div className="flex gap-2">
                  <Input
                    type="color"
                    className="h-9 w-14 cursor-pointer p-1"
                    value={form.branding?.navInactiveColor || "#52525b"}
                    onChange={(e) => patchBranding({ navInactiveColor: e.target.value })}
                  />
                  <Input
                    value={form.branding?.navInactiveColor || "#52525b"}
                    onChange={(e) => patchBranding({ navInactiveColor: e.target.value })}
                  />
                </div>
              </FormField>
              <FormField
                label="Sidebar background"
                hint="Sidebar panel color."
              >
                <div className="flex gap-2">
                  <Input
                    type="color"
                    className="h-9 w-14 cursor-pointer p-1"
                    value={form.branding?.sidebarColor || "#f7f7f7"}
                    onChange={(e) => patchBranding({ sidebarColor: e.target.value })}
                  />
                  <Input
                    value={form.branding?.sidebarColor || "#f7f7f7"}
                    onChange={(e) => patchBranding({ sidebarColor: e.target.value })}
                  />
                </div>
              </FormField>
              <FormField label="Header color" hint="Top admin header background.">
                <div className="flex gap-2">
                  <Input
                    type="color"
                    className="h-9 w-14 cursor-pointer p-1"
                    value={form.branding?.headerColor || "#000000"}
                    onChange={(e) => patchBranding({ headerColor: e.target.value })}
                  />
                  <Input
                    value={form.branding?.headerColor || "#000000"}
                    onChange={(e) => patchBranding({ headerColor: e.target.value })}
                  />
                </div>
              </FormField>
              <FormField
                label="Button background"
                hint="Primary buttons."
              >
                <div className="flex gap-2">
                  <Input
                    type="color"
                    className="h-9 w-14 cursor-pointer p-1"
                    value={form.branding?.buttonBgColor || "#5c3758"}
                    onChange={(e) => patchBranding({ buttonBgColor: e.target.value })}
                  />
                  <Input
                    value={form.branding?.buttonBgColor || "#5c3758"}
                    onChange={(e) => patchBranding({ buttonBgColor: e.target.value })}
                  />
                </div>
              </FormField>
              <FormField
                label="Button text color"
                hint="Text on primary buttons."
              >
                <div className="flex gap-2">
                  <Input
                    type="color"
                    className="h-9 w-14 cursor-pointer p-1"
                    value={form.branding?.buttonTextColor || "#ffffff"}
                    onChange={(e) => patchBranding({ buttonTextColor: e.target.value })}
                  />
                  <Input
                    value={form.branding?.buttonTextColor || "#ffffff"}
                    onChange={(e) => patchBranding({ buttonTextColor: e.target.value })}
                  />
                </div>
              </FormField>
            </fieldset>
          </SectionCard>
        </>
      ) : null}

      {section === "email" ? (
        <>
          <SectionCard
            title="Email settings"
            description="These values are saved to your store settings and used for outgoing mail and staff alerts."
          >
          <div className="grid gap-4 sm:grid-cols-2">
            <FormField
              label="Sender name"
              hint="Display name shown on emails sent from this store."
            >
              <Input
                value={form.email.fromName}
                onChange={(e) =>
                  setForm({ ...form, email: { ...form.email, fromName: e.target.value } })
                }
              placeholder="Your store name"
              />
            </FormField>
            <FormField
              label="Sender email"
              hint="From address used when this store sends email."
            >
              <Input
                type="email"
                value={form.email.fromEmail}
                onChange={(e) =>
                  setForm({ ...form, email: { ...form.email, fromEmail: e.target.value } })
                }
                placeholder="orders@yourstore.com"
              />
            </FormField>
            <FormField
              label="Reply-to email"
              hint="Address that receives replies when customers respond."
              className="sm:col-span-2"
            >
              <Input
                type="email"
                value={form.email.replyTo}
                onChange={(e) =>
                  setForm({ ...form, email: { ...form.email, replyTo: e.target.value } })
                }
                placeholder="hello@yourstore.com"
              />
            </FormField>
            <div className="flex items-center justify-between gap-4 sm:col-span-2">
              <div className="min-w-0">
                <p className="text-sm font-medium">New order alerts</p>
                <p className="text-xs text-muted-foreground">
                  Email staff when a customer places a new order.
                </p>
              </div>
              <Switch
                checked={form.email.orderNotifications}
                onCheckedChange={(checked) =>
                  setForm({
                    ...form,
                    email: { ...form.email, orderNotifications: checked },
                  })
                }
              />
            </div>
            <div className="flex items-center justify-between gap-4 sm:col-span-2">
              <div className="min-w-0">
                <p className="text-sm font-medium">Contact form alerts</p>
                <p className="text-xs text-muted-foreground">
                  Email staff when someone submits the contact form.
                </p>
              </div>
              <Switch
                checked={form.email.contactNotifications}
                onCheckedChange={(checked) =>
                  setForm({
                    ...form,
                    email: { ...form.email, contactNotifications: checked },
                  })
                }
              />
            </div>
          </div>
          </SectionCard>

          <SectionCard title="Inventory tracking">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="flex items-center justify-between gap-4 sm:col-span-2">
              <div className="min-w-0">
                <p className="text-sm font-medium">Low stock alerts</p>
                <p className="text-xs text-muted-foreground">
                  Email staff when tracked products reach low or zero quantity.
                </p>
              </div>
              <Switch
                checked={form.email.inventoryNotifications}
                onCheckedChange={(checked) =>
                  setForm({
                    ...form,
                    email: { ...form.email, inventoryNotifications: checked },
                  })
                }
              />
            </div>
            <FormField
              label="Alert email"
              hint="Leave blank to use the store contact email."
              className="sm:col-span-2"
            >
              <Input
                type="email"
                value={form.email.inventoryNotificationEmail}
                onChange={(e) =>
                  setForm({
                    ...form,
                    email: { ...form.email, inventoryNotificationEmail: e.target.value },
                  })
                }
                placeholder={form.store.email || "inventory@yourstore.com"}
                disabled={!form.email.inventoryNotifications}
              />
            </FormField>
          </div>
          </SectionCard>
        </>
      ) : null}
    </div>
  );
}
