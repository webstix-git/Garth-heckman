import { NextResponse } from "next/server";

import { auth } from "@/auth";
import { createMediaFromFile, listMedia } from "@/services/media-server";
import type { MediaType } from "@/types";

export const runtime = "nodejs";

export async function GET(req: Request) {
  try {
    const url = new URL(req.url);
    const search = url.searchParams.get("search") || undefined;
    const type = (url.searchParams.get("type") as MediaType | "all" | null) || "all";
    const data = await listMedia(search, type);
    return NextResponse.json({ data });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to load media" },
      { status: 500 },
    );
  }
}

export async function POST(req: Request) {
  try {
    // Read multipart body before any cookie/session helpers.
    const form = await req.formData();
    const file = form.get("file");
    if (!(file instanceof File)) {
      return NextResponse.json({ error: "file is required" }, { status: 400 });
    }

    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Not signed in" }, { status: 401 });
    }

    let context: import("@/types").MediaUploadContext | null = null;
    const rawContext = form.get("context");
    if (typeof rawContext === "string" && rawContext.trim()) {
      try {
        context = JSON.parse(rawContext) as import("@/types").MediaUploadContext;
      } catch {
        context = null;
      }
    }

    const data = await createMediaFromFile(file, session.user.id, context);
    return NextResponse.json({ data }, { status: 201 });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Upload failed";
    const friendly = /formdata/i.test(message)
      ? "Image is too large to upload. Use a file under 20MB."
      : message;
    return NextResponse.json({ error: friendly }, { status: 400 });
  }
}
