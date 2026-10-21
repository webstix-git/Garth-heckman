import { NextResponse } from "next/server";

import { auth } from "@/auth";
import { uploadAdminAvatar } from "@/lib/avatar-upload";
import { updateProfile } from "@/services/auth-actions";

export const runtime = "nodejs";

export async function POST(req: Request) {
  try {
    const form = await req.formData();
    const file = form.get("file");
    if (!(file instanceof File)) {
      return NextResponse.json({ error: "file is required" }, { status: 400 });
    }

    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Not signed in" }, { status: 401 });
    }

    const uploaded = await uploadAdminAvatar(file, session.user.id);
    if (!uploaded.ok || !uploaded.url) {
      return NextResponse.json({ error: uploaded.error || "Upload failed" }, { status: 400 });
    }

    const profile = await updateProfile({ avatar: uploaded.url });
    return NextResponse.json({ data: { url: uploaded.url, profile } });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Upload failed" },
      { status: 500 },
    );
  }
}
