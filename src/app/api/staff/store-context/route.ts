import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { getCurrentAdminStoreId } from "@/staff/lib/current-admin-store";
import { requireAdminContext } from "@/staff/lib/require-admin-context";

export const runtime = "nodejs";

export async function GET() {
  try {
    const context = await requireAdminContext();
    return NextResponse.json({ data: { storeId: context.storeId, role: context.role } });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Unauthorized" }, { status: 401 });
  }
}

export async function POST(req: Request) {
  try {
    await requireAdminContext();
    const body = (await req.json()) as { storeId?: string };
    if (!body.storeId || !/^[a-zA-Z0-9_-]{1,64}$/.test(body.storeId)) {
      return NextResponse.json({ error: "A valid storeId is required." }, { status: 400 });
    }
    const cookieStore = await cookies();
    cookieStore.set("admin-selected-store", body.storeId, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: 60 * 60 * 8,
    });
    // Re-read through the authorization boundary so a user cannot select an arbitrary store.
    const selected = await getCurrentAdminStoreId();
    return NextResponse.json({ data: { storeId: selected } });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Store selection failed" }, { status: 403 });
  }
}
