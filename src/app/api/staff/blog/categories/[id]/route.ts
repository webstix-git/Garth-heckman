import { NextResponse } from "next/server";
import { getBlogCategory, permanentlyDeleteBlogCategory, restoreBlogCategory, trashBlogCategory, updateBlogCategory } from "@/services/blog-server";
export const runtime = "nodejs";
type Ctx = { params: Promise<{ id: string }> };
export async function GET(_: Request, ctx: Ctx) { const { id } = await ctx.params; const data = await getBlogCategory(id); return data ? NextResponse.json({ data }) : NextResponse.json({ error: "Not found" }, { status: 404 }); }
export async function PATCH(req: Request, ctx: Ctx) { const { id } = await ctx.params; return NextResponse.json({ data: await updateBlogCategory(id, await req.json()) }); }
export async function DELETE(req: Request, ctx: Ctx) { const { id } = await ctx.params; if (new URL(req.url).searchParams.get("permanent") === "1") await permanentlyDeleteBlogCategory(id); else await trashBlogCategory(id); return NextResponse.json({ ok: true }); }
export async function POST(_: Request, ctx: Ctx) { const { id } = await ctx.params; await restoreBlogCategory(id); return NextResponse.json({ ok: true }); }
