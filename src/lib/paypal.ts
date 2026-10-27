import "server-only";

/**
 * Server-only PayPal Orders v2 client for this storefront's own PayPal account.
 * PAYPAL_CLIENT_SECRET never reaches the browser; the store backend only records the result.
 */

let cachedToken: { value: string; expiresAt: number } | null = null;

function credentials() {
  return {
    clientId: String(process.env.PAYPAL_CLIENT_ID ?? "").trim(),
    clientSecret: String(process.env.PAYPAL_CLIENT_SECRET ?? "").trim(),
    mode: String(process.env.PAYPAL_MODE ?? "").trim() === "live" ? "live" : "sandbox",
  } as const;
}

function baseUrl() {
  return credentials().mode === "live" ? "https://api-m.paypal.com" : "https://api-m.sandbox.paypal.com";
}

/** PayPal is offered only when payments can also be recorded with the backend (STORE_SECRET_KEY). */
export function paypalConfigured() {
  const { clientId, clientSecret } = credentials();
  return Boolean(clientId && clientSecret && String(process.env.STORE_SECRET_KEY ?? "").trim());
}

export function paypalClientId() {
  return credentials().clientId;
}

export class PayPalError extends Error {
  constructor(public issue: string, public status: number) {
    super(`PayPal: ${issue}`);
  }
}

async function accessToken() {
  if (cachedToken && cachedToken.expiresAt > Date.now() + 60_000) return cachedToken.value;
  const { clientId, clientSecret } = credentials();
  if (!clientId || !clientSecret) throw new PayPalError("NOT_CONFIGURED", 503);
  const response = await fetch(`${baseUrl()}/v1/oauth2/token`, {
    method: "POST",
    headers: {
      Authorization: `Basic ${Buffer.from(`${clientId}:${clientSecret}`).toString("base64")}`,
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: "grant_type=client_credentials",
    cache: "no-store",
    signal: AbortSignal.timeout(15000),
  });
  if (!response.ok) throw new PayPalError("AUTHENTICATION_FAILED", 502);
  const body = (await response.json()) as { access_token: string; expires_in: number };
  cachedToken = { value: body.access_token, expiresAt: Date.now() + body.expires_in * 1000 };
  return body.access_token;
}

async function paypalRequest<T>(pathname: string, body?: unknown, requestId?: string, method: "GET" | "POST" = "POST"): Promise<T> {
  const response = await fetch(`${baseUrl()}${pathname}`, {
    method,
    headers: {
      Authorization: `Bearer ${await accessToken()}`,
      "Content-Type": "application/json",
      ...(requestId ? { "PayPal-Request-Id": requestId } : {}),
    },
    body: body === undefined ? undefined : JSON.stringify(body),
    cache: "no-store",
    signal: AbortSignal.timeout(20000),
  });
  const data = (await response.json().catch(() => ({}))) as T & { name?: string; details?: Array<{ issue?: string }> };
  if (!response.ok) throw new PayPalError(data.details?.[0]?.issue ?? data.name ?? `HTTP_${response.status}`, response.status);
  return data;
}

/** Opens a PayPal order for a store order. The amount comes from the backend-priced order. */
export async function createPayPalOrder(input: { orderId: string; orderNumber: string; totalCents: number; storeName: string }) {
  const result = await paypalRequest<{ id: string }>(
    "/v2/checkout/orders",
    {
      intent: "CAPTURE",
      purchase_units: [
        {
          reference_id: input.orderId,
          custom_id: input.orderId,
          invoice_id: `${input.orderNumber}-${input.orderId.slice(0, 8)}`,
          description: `${input.storeName} order #${input.orderNumber}`.slice(0, 127),
          amount: { currency_code: "USD", value: (input.totalCents / 100).toFixed(2) },
        },
      ],
      application_context: { shipping_preference: "NO_SHIPPING", user_action: "PAY_NOW", brand_name: input.storeName.slice(0, 127) },
    },
    `create-${input.orderId}`,
  );
  return result.id;
}

type PayPalOrderResult = {
  status: string;
  purchase_units?: Array<{ reference_id?: string; payments?: { captures?: Array<{ id: string; status: string; amount: { value: string; currency_code: string } }> } }>;
  payer?: { email_address?: string };
};

/** Captures an approved PayPal order. An order captured by an earlier attempt is read back instead. */
export async function capturePayPalOrder(paypalOrderId: string) {
  const path = `/v2/checkout/orders/${encodeURIComponent(paypalOrderId)}`;
  let result: PayPalOrderResult;
  try {
    result = await paypalRequest<PayPalOrderResult>(`${path}/capture`, {}, `capture-${paypalOrderId}`);
  } catch (error) {
    if (!(error instanceof PayPalError) || error.issue !== "ORDER_ALREADY_CAPTURED") throw error;
    result = await paypalRequest<PayPalOrderResult>(path, undefined, undefined, "GET");
  }
  const unit = result.purchase_units?.[0];
  const capture = unit?.payments?.captures?.[0];
  return {
    status: result.status,
    referenceId: unit?.reference_id ?? null,
    captureId: capture?.id ?? null,
    captureStatus: capture?.status ?? null,
    amountCents: capture ? Math.round(Number(capture.amount.value) * 100) : null,
    currency: capture?.amount.currency_code ?? null,
    payerEmail: result.payer?.email_address ?? null,
  };
}
