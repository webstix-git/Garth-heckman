"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";

import { APP_LOGO_SRC, APP_NAME, APP_TAGLINE, BRAND_NAVY } from "@/lib/constants";
import { getSettings } from "@/services/settings";
import type { StoreSettings } from "@/types";

type StoreBrandValue = {
  settings: StoreSettings;
  loading: boolean;
  reload: () => Promise<void>;
  applyLocal: (next: StoreSettings) => void;
};

function cacheKey() {
  if (typeof window === "undefined") return "gh.admin.store-settings";
  // Settings are tenant-scoped; never reuse one store's identity on another host.
  return `gh.admin.store-settings:${window.location.hostname.toLowerCase()}`;
}

export const FALLBACK_STORE_SETTINGS: StoreSettings = {
  store: {
    name: APP_NAME,
    email: "",
    phone: "",
    currency: "USD",
    timezone: "America/Chicago",
    address: {
      line1: "",
      city: "",
      state: "",
      postalCode: "",
      country: "United States",
    },
    logoUrl: APP_LOGO_SRC,
    tagline: APP_TAGLINE,
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

function readCachedSettings(): StoreSettings | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(cacheKey());
    if (!raw) return null;
    const parsed = JSON.parse(raw) as StoreSettings;
    if (!parsed?.store?.name) return null;
    // Drop legacy typo cache so it never paints again.
    if (/grath/i.test(parsed.store.name) || /grath/i.test(parsed.email?.fromName || "")) {
      window.localStorage.removeItem(cacheKey());
      return null;
    }
    return parsed;
  } catch {
    return null;
  }
}

function writeCachedSettings(next: StoreSettings) {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(cacheKey(), JSON.stringify(next));
  } catch {
    // ignore quota / private mode
  }
}

const StoreBrandContext = createContext<StoreBrandValue | null>(null);

export function StoreBrandProvider({
  children,
  initialSettings,
}: {
  children: ReactNode;
  /** Server-fetched settings so the first paint is already correct. */
  initialSettings?: StoreSettings | null;
}) {
  const [settings, setSettings] = useState<StoreSettings>(
    () => initialSettings || FALLBACK_STORE_SETTINGS,
  );
  const [loading, setLoading] = useState(!initialSettings);

  const applySettings = useCallback((next: StoreSettings) => {
    setSettings(next);
    writeCachedSettings(next);
  }, []);

  const reload = useCallback(async () => {
    try {
      const next = await getSettings();
      applySettings(next);
    } catch {
      // keep current / fallback
    } finally {
      setLoading(false);
    }
  }, [applySettings]);

  useEffect(() => {
    // Prefer cached brand immediately on the client if the server didn't pass settings.
    if (!initialSettings) {
      const cached = readCachedSettings();
      if (cached) {
        setSettings(cached);
        setLoading(false);
      }
    } else {
      writeCachedSettings(initialSettings);
    }
    void reload();
  }, [initialSettings, reload]);

  const value = useMemo(
    () => ({
      settings,
      loading,
      reload,
      applyLocal: applySettings,
    }),
    [settings, loading, reload, applySettings],
  );

  return <StoreBrandContext.Provider value={value}>{children}</StoreBrandContext.Provider>;
}

export function useStoreBrand() {
  const ctx = useContext(StoreBrandContext);
  if (!ctx) {
    return {
      settings: FALLBACK_STORE_SETTINGS,
      loading: false,
      reload: async () => undefined,
      applyLocal: (_next: StoreSettings) => undefined,
    };
  }
  return ctx;
}
