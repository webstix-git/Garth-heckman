import "server-only";

import type { StoreSettings } from "@/types";
import { APP_LOGO_SRC, APP_NAME, BRAND_NAVY } from "@/lib/constants";
import { getCurrentAdminStoreId } from "@/lib/current-admin-store";
import { getRequestStoreId } from "@/lib/tenant-store";
import { createSupabaseAdmin, isSupabaseConfigured } from "@/lib/supabase";

type DbStoreSettings = {
  store_id: string;
  general: Record<string, unknown> | null;
  localization: Record<string, unknown> | null;
  notifications: Record<string, unknown> | null;
  storefront: Record<string, unknown> | null;
  seo: Record<string, unknown> | null;
};

const DEFAULT_SETTINGS: StoreSettings = {
  store: {
    name: APP_NAME,
    email: "",
    phone: "",
    currency: "USD",
    timezone: "America/Chicago",
    address: {
      line1: "",
      line2: "",
      city: "",
      state: "",
      postalCode: "",
      country: "United States",
    },
    logoUrl: APP_LOGO_SRC,
    tagline: "Admin Portal",
  },
  branding: {
    primaryColor: BRAND_NAVY,
    sidebarColor: "#f7f7f7",
    headerColor: "#000000",
    navInactiveColor: "#52525b",
    navHeadingColor: "#71717a",
    buttonBgColor: BRAND_NAVY,
    buttonTextColor: "#ffffff",
  },
  payments: { paypalEnabled: true, venmoEnabled: true, cashOnDeliveryEnabled: false, mode: "sandbox" },
  email: {
    fromName: APP_NAME,
    fromEmail: "",
    replyTo: "",
    orderNotifications: true,
    contactNotifications: true,
    inventoryNotifications: true,
    inventoryNotificationEmail: "",
    lowStockThreshold: 5,
  },
  storefront: {
    homeSpotlightProductId: null,
    storeSpotlightProductId: null,
  },
  seo: {
    noindex: false,
  },
};

function asString(value: unknown, fallback = "") {
  return typeof value === "string" ? value : fallback;
}

function asBool(value: unknown, fallback: boolean) {
  return typeof value === "boolean" ? value : fallback;
}

function asNumber(value: unknown, fallback: number) {
  if (typeof value === "number" && Number.isFinite(value)) return value;
  if (typeof value === "string" && value.trim() !== "") {
    const parsed = Number(value);
    if (Number.isFinite(parsed)) return parsed;
  }
  return fallback;
}

function asAddress(value: unknown): StoreSettings["store"]["address"] {
  const raw = value && typeof value === "object" ? (value as Record<string, unknown>) : {};
  return {
    line1: asString(raw.line1),
    line2: asString(raw.line2) || undefined,
    city: asString(raw.city),
    state: asString(raw.state),
    postalCode: asString(raw.postalCode ?? raw.postal_code),
    country: asString(raw.country, "United States"),
  };
}

function asNullableId(value: unknown): string | null {
  if (value === null || value === undefined) return null;
  if (typeof value !== "string") return null;
  return value;
}

function mapStorefront(raw: Record<string, unknown> | null | undefined): StoreSettings["storefront"] {
  const data = raw && typeof raw === "object" ? raw : {};
  return {
    homeSpotlightProductId: asNullableId(data.homeSpotlightProductId),
    storeSpotlightProductId: asNullableId(data.storeSpotlightProductId),
  };
}

function mapSeo(raw: Record<string, unknown> | null | undefined): StoreSettings["seo"] {
  const data = raw && typeof raw === "object" ? raw : {};
  return {
    noindex: asBool(data.noindex, false),
  };
}

function mapRow(row: DbStoreSettings | null): StoreSettings {
  const general = row?.general || {};
  const localization = row?.localization || {};
  const notifications = row?.notifications || {};
  const brandingRaw =
    general.branding && typeof general.branding === "object"
      ? (general.branding as Record<string, unknown>)
      : {};

  return {
    store: {
      name: asString(general.name, DEFAULT_SETTINGS.store.name),
      email: asString(general.email),
      phone: asString(general.phone),
      currency: asString(localization.currency, DEFAULT_SETTINGS.store.currency),
      timezone: asString(localization.timezone, DEFAULT_SETTINGS.store.timezone),
      address: asAddress(general.address),
      logoUrl: asString(general.logoUrl, DEFAULT_SETTINGS.store.logoUrl),
      tagline: asString(general.tagline, DEFAULT_SETTINGS.store.tagline),
    },
    branding: {
      primaryColor: asString(brandingRaw.primaryColor, DEFAULT_SETTINGS.branding.primaryColor),
      sidebarColor: asString(
        brandingRaw.sidebarColor ?? brandingRaw.accentColor,
        DEFAULT_SETTINGS.branding.sidebarColor,
      ),
      headerColor: asString(brandingRaw.headerColor, DEFAULT_SETTINGS.branding.headerColor),
      navInactiveColor: asString(
        brandingRaw.navInactiveColor,
        DEFAULT_SETTINGS.branding.navInactiveColor,
      ),
      navHeadingColor: asString(
        brandingRaw.navHeadingColor,
        DEFAULT_SETTINGS.branding.navHeadingColor,
      ),
      buttonBgColor: asString(
        brandingRaw.buttonBgColor,
        DEFAULT_SETTINGS.branding.buttonBgColor,
      ),
      buttonTextColor: asString(
        brandingRaw.buttonTextColor,
        DEFAULT_SETTINGS.branding.buttonTextColor,
      ),
    },
    payments: {
      paypalEnabled: asBool((general.payments as Record<string, unknown> | undefined)?.paypalEnabled, true),
      venmoEnabled: asBool((general.payments as Record<string, unknown> | undefined)?.venmoEnabled, true),
      cashOnDeliveryEnabled: asBool((general.payments as Record<string, unknown> | undefined)?.cashOnDeliveryEnabled, false),
      mode: (general.payments as Record<string, unknown> | undefined)?.mode === "live" ? "live" : "sandbox",
    },
    email: {
      fromName: asString(notifications.fromName, DEFAULT_SETTINGS.email.fromName),
      fromEmail: asString(notifications.fromEmail),
      replyTo: asString(notifications.replyTo),
      orderNotifications: asBool(
        notifications.orderNotifications,
        DEFAULT_SETTINGS.email.orderNotifications,
      ),
      contactNotifications: asBool(
        notifications.contactNotifications,
        DEFAULT_SETTINGS.email.contactNotifications,
      ),
      inventoryNotifications: asBool(
        notifications.inventoryNotifications,
        DEFAULT_SETTINGS.email.inventoryNotifications,
      ),
      inventoryNotificationEmail: asString(notifications.inventoryNotificationEmail),
      lowStockThreshold: Math.max(
        0,
        Math.floor(
          asNumber(
            notifications.lowStockThreshold,
            DEFAULT_SETTINGS.email.lowStockThreshold,
          ),
        ),
      ),
    },
    storefront: mapStorefront(row?.storefront),
    seo: mapSeo(row?.seo),
  };
}

function toDbPayload(settings: StoreSettings, storeId: string) {
  return {
    store_id: storeId,
    general: {
      name: settings.store.name,
      email: settings.store.email,
      phone: settings.store.phone,
      address: settings.store.address,
      logoUrl: settings.store.logoUrl,
      tagline: settings.store.tagline,
      branding: {
        primaryColor: settings.branding.primaryColor,
        sidebarColor: settings.branding.sidebarColor,
        headerColor: settings.branding.headerColor,
        navInactiveColor: settings.branding.navInactiveColor,
        navHeadingColor: settings.branding.navHeadingColor,
        buttonBgColor: settings.branding.buttonBgColor,
        buttonTextColor: settings.branding.buttonTextColor,
      },
      payments: {
        paypalEnabled: settings.payments?.paypalEnabled ?? true,
        venmoEnabled: settings.payments?.venmoEnabled ?? true,
        cashOnDeliveryEnabled: settings.payments?.cashOnDeliveryEnabled ?? false,
        mode: settings.payments?.mode ?? "sandbox",
      },
    },
    localization: {
      currency: settings.store.currency,
      timezone: settings.store.timezone,
    },
    notifications: {
      fromName: settings.email.fromName,
      fromEmail: settings.email.fromEmail,
      replyTo: settings.email.replyTo,
      orderNotifications: settings.email.orderNotifications,
      contactNotifications: settings.email.contactNotifications,
      inventoryNotifications: settings.email.inventoryNotifications,
      inventoryNotificationEmail: settings.email.inventoryNotificationEmail,
      lowStockThreshold: settings.email.lowStockThreshold,
    },
    storefront: {
      homeSpotlightProductId: settings.storefront?.homeSpotlightProductId ?? null,
      storeSpotlightProductId: settings.storefront?.storeSpotlightProductId ?? null,
    },
    seo: {
      noindex: Boolean(settings.seo?.noindex),
    },
    updated_at: new Date().toISOString(),
  };
}

export async function fetchStoreSettings(storeIdOverride?: string): Promise<{
  ok: boolean;
  settings: StoreSettings;
  error?: string;
}> {
  if (!isSupabaseConfigured()) {
    return { ok: false, settings: structuredClone(DEFAULT_SETTINGS), error: "Database is not configured" };
  }
  try {
    const storeId = storeIdOverride || (await getRequestStoreId());
    const supabase = createSupabaseAdmin();
    const { data, error } = await supabase
      .from("store_settings")
      .select("store_id, general, localization, notifications, storefront, seo")
      .eq("store_id", storeId)
      .maybeSingle();

    if (error) {
      return { ok: false, settings: structuredClone(DEFAULT_SETTINGS), error: error.message };
    }

    if (!data) {
      // Prefer store name from stores table when settings row is missing.
      const { data: store } = await supabase
        .from("stores")
        .select("name")
        .eq("id", storeId)
        .maybeSingle();
      const defaults = structuredClone(DEFAULT_SETTINGS);
      if (store?.name) defaults.store.name = store.name;
      if (storeId !== "0001") {
        defaults.store.logoUrl = "";
        defaults.email.fromName = defaults.store.name || "Store Admin";
      }
      return { ok: true, settings: defaults };
    }

    return { ok: true, settings: mapRow(data as DbStoreSettings) };
  } catch (err) {
    return {
      ok: false,
      settings: structuredClone(DEFAULT_SETTINGS),
      error: err instanceof Error ? err.message : "Failed to load settings",
    };
  }
}

export async function saveStoreSettings(
  settings: StoreSettings,
): Promise<{ ok: boolean; settings?: StoreSettings; error?: string }> {
  if (!isSupabaseConfigured()) {
    return { ok: false, error: "Database is not configured" };
  }
  try {
    const storeId = await getCurrentAdminStoreId();
    const supabase = createSupabaseAdmin();

    // Merge with the existing row so store/branding saves never wipe email
    // (notifications), and email saves never wipe unrelated jsonb keys.
    const { data: existing, error: existingError } = await supabase
      .from("store_settings")
      .select("store_id, general, localization, notifications, storefront, seo")
      .eq("store_id", storeId)
      .maybeSingle();

    if (existingError) {
      return { ok: false, error: existingError.message };
    }

    const next = toDbPayload(settings, storeId);
    const prevGeneral =
      existing?.general && typeof existing.general === "object"
        ? (existing.general as Record<string, unknown>)
        : {};
    const prevLocalization =
      existing?.localization && typeof existing.localization === "object"
        ? (existing.localization as Record<string, unknown>)
        : {};
    const prevNotifications =
      existing?.notifications && typeof existing.notifications === "object"
        ? (existing.notifications as Record<string, unknown>)
        : {};
    const prevStorefront =
      existing?.storefront && typeof existing.storefront === "object"
        ? (existing.storefront as Record<string, unknown>)
        : {};
    const prevSeo =
      existing?.seo && typeof existing.seo === "object"
        ? (existing.seo as Record<string, unknown>)
        : {};

    const payload = {
      ...next,
      general: {
        ...prevGeneral,
        ...next.general,
        branding: {
          ...((prevGeneral.branding && typeof prevGeneral.branding === "object"
            ? prevGeneral.branding
            : {}) as Record<string, unknown>),
          ...(next.general.branding as Record<string, unknown>),
        },
      },
      localization: {
        ...prevLocalization,
        ...next.localization,
      },
      notifications: {
        ...prevNotifications,
        ...next.notifications,
      },
      storefront: {
        ...prevStorefront,
        ...(next.storefront as Record<string, unknown>),
      },
      seo: {
        ...prevSeo,
        ...(next.seo as Record<string, unknown>),
      },
    };

    const { data, error } = await supabase
      .from("store_settings")
      .upsert(payload, { onConflict: "store_id" })
      .select("store_id, general, localization, notifications, storefront, seo")
      .single();

    if (error || !data) {
      return { ok: false, error: error?.message || "Failed to save settings" };
    }

    // Keep stores.name in sync for multi-project template use.
    await supabase
      .from("stores")
      .update({ name: settings.store.name, updated_at: new Date().toISOString() })
      .eq("id", storeId);

    return { ok: true, settings: mapRow(data as DbStoreSettings) };
  } catch (err) {
    return {
      ok: false,
      error: err instanceof Error ? err.message : "Failed to save settings",
    };
  }
}

export { DEFAULT_SETTINGS };
