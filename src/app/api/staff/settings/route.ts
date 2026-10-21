import { NextResponse } from "next/server";
import { getSettings, saveSettings } from "@/services/settings-server";
import type { StoreSettings } from "@/types";

export const runtime = "nodejs";

export async function GET() {
  try {
    const data = await getSettings();
    return NextResponse.json({ data });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to load settings" },
      { status: 500 },
    );
  }
}

export async function PUT(req: Request) {
  try {
    const body = (await req.json()) as StoreSettings;
    const data = await saveSettings(body);
    return NextResponse.json({ data });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to save settings" },
      { status: 400 },
    );
  }
}
