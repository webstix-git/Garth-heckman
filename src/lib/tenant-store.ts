import "server-only";

import { headers } from "next/headers";

import { createAdminClient, isSupabaseAdminConfigured } from "@/lib/supabase/admin";

/** The existing Garth storefront remains the safe local-development fallback. */
export const GARTH_STORE_ID = "0001";

export type TenantStore = {
  id: string;
  name: string;
  slug: string;
  currency: string;
  domain: string;
};

function cleanHost(value: string | null | undefined) {
  return String(value || "")
    .trim()
    .toLowerCase()
    .replace(/^https?:\/\//, "")
    .split("/")[0]
    .replace(/:\d+$/, "");
}

function localStoreForHost(host: string): TenantStore | null {
  const local = host.replace(/\.localhost$/, "");
  const configuredGarthHosts = [process.env.NEXT_PUBLIC_SITE_URL, process.env.STOREFRONT_URL]
    .map(cleanHost)
    .filter(Boolean);

  // The primary storefront must work before its domain is registered in the
  // multi-tenant store_domains table. Include the deployed Vercel hostname
  // and any production hostname explicitly configured for this storefront.
  if (
    host === "garth-heckman.vercel.app" ||
    host === "garthheckman.com" ||
    host === "www.garthheckman.com" ||
    configuredGarthHosts.includes(host)
  ) {
    return { id: GARTH_STORE_ID, name: "Garth Heckman", slug: "garthheckman", currency: "USD", domain: host };
  }
  if (host === "fashion.localhost" || local === "fashion") {
    return { id: "1001", name: "Northstar Goods", slug: "northstar-goods", currency: "USD", domain: host };
  }
  if (host === "home.localhost" || local === "home") {
    return { id: "1002", name: "Hearth & Loom", slug: "hearth-and-loom", currency: "USD", domain: host };
  }
  if (host === "garth.localhost" || host === "localhost" || host === "127.0.0.1") {
    return { id: GARTH_STORE_ID, name: "Garth Heckman", slug: "garthheckman", currency: "USD", domain: host };
  }
  return null;
}

/**
 * Resolves a storefront from its host. The hostname is the tenant boundary;
 * callers never accept a store_id from browser input.
 */
export async function resolveStoreForHost(hostValue: string | null | undefined): Promise<TenantStore | null> {
  const host = cleanHost(hostValue);
  // Next's build-time metadata pass has no incoming host. Preserve the
  // original storefront for that pass; real unknown production hosts fail.
  if (!host) {
    return { id: GARTH_STORE_ID, name: "Garth Heckman", slug: "garthheckman", currency: "USD", domain: "" };
  }
  const localStore = localStoreForHost(host);
  if (localStore) return localStore;

  if (!host || !isSupabaseAdminConfigured()) return null;
  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("store_domains")
    .select("domain, stores!inner(id, name, slug, currency, status)")
    .eq("domain", host)
    .eq("stores.status", "active")
    .maybeSingle();

  if (error || !data) return null;
  const store = Array.isArray(data.stores) ? data.stores[0] : data.stores;
  if (!store || store.status !== "active") return null;
  return {
    id: store.id,
    name: store.name,
    slug: store.slug,
    currency: store.currency || "USD",
    domain: data.domain,
  };
}

export async function getRequestStore(): Promise<TenantStore> {
  const requestHeaders = await headers();
  const host = requestHeaders.get("x-forwarded-host") || requestHeaders.get("host");
  const store = await resolveStoreForHost(host);
  if (!store) throw new Error("Unknown storefront domain.");
  return store;
}

export async function getRequestStoreId(): Promise<string> {
  return (await getRequestStore()).id;
}
