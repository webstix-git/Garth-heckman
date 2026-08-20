import { NextResponse } from "next/server";
import { placeSampleOrder, type SampleOrderInput } from "@/lib/place-sample-order";
import { isSampleCheckoutServer } from "@/lib/sample-mode";

export async function POST(req: Request) {
  if (!isSampleCheckoutServer()) {
    return NextResponse.json({ error: "Sample checkout is off." }, { status: 403 });
  }

  let body: SampleOrderInput;
  try {
    body = (await req.json()) as SampleOrderInput;
  } catch {
    return NextResponse.json({ error: "Invalid request." }, { status: 400 });
  }

  try {
    const order = await placeSampleOrder(body);
    return NextResponse.json({ order });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Could not place the sample order.";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
