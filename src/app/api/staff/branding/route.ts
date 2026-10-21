import { NextResponse } from "next/server";
import { fetchStoreSettings } from "@/lib/settings-supabase";
import { getCurrentAdminStoreId } from "@/lib/current-admin-store";

export const runtime = "nodejs";

/** Public brand payload for login / unauthenticated chrome. */
export async function GET() {
    const result = await fetchStoreSettings(await getCurrentAdminStoreId());
  const settings = result.settings;
  return NextResponse.json({
    data: {
      name: settings.store.name,
      tagline: settings.store.tagline,
      logoUrl: settings.store.logoUrl,
      primaryColor: settings.branding.primaryColor,
      sidebarColor: settings.branding.sidebarColor,
      headerColor: settings.branding.headerColor,
      buttonBgColor: settings.branding.buttonBgColor,
      buttonTextColor: settings.branding.buttonTextColor,
    },
  });
}
