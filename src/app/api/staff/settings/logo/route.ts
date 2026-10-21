import { NextResponse } from "next/server";
import { uploadStoreLogo } from "@/lib/logo-upload";

export const runtime = "nodejs";

export async function POST(req: Request) {
  try {
    const form = await req.formData();
    const file = form.get("file");
    if (!(file instanceof File)) {
      return NextResponse.json({ error: "file is required" }, { status: 400 });
    }
    const result = await uploadStoreLogo(file);
    if (!result.ok || !result.url) {
      return NextResponse.json({ error: result.error || "Upload failed" }, { status: 400 });
    }
    return NextResponse.json({ data: { url: result.url } });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Upload failed" },
      { status: 500 },
    );
  }
}
