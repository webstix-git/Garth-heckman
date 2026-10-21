import { NextResponse } from "next/server";

import { getAttributeOptionPresets } from "@/services/attribute-presets-server";

export const runtime = "nodejs";

export async function GET() {
  try {
    const data = await getAttributeOptionPresets();
    return NextResponse.json({ data });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to load attribute presets" },
      { status: 500 },
    );
  }
}
