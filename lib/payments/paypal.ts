import "server-only";

type PayPalLink = { href: string; rel: string; method: string };

export type PayPalOrder = {
  id: string;
  status: string;
  links?: PayPalLink[];
  purchase_units?: Array<{
    reference_id?: string;
    amount?: { currency_code: string; value: string };
    payments?: {
      captures?: Array<{
        id: string;
        status: string;
        amount: { currency_code: string; value: string };
      }>;
    };
  }>;
};

type PayPalWebhookHeaders = {
  authAlgorithm: string;
  certUrl: string;
  transmissionId: string;
  transmissionSignature: string;
  transmissionTime: string;
};

function apiBase(): string {
  return process.env.PAYPAL_ENVIRONMENT === "live"
    ? "https://api-m.paypal.com"
    : "https://api-m.sandbox.paypal.com";
}

async function accessToken(): Promise<string> {
  const clientId = process.env.PAYPAL_CLIENT_ID;
  const clientSecret = process.env.PAYPAL_CLIENT_SECRET;
  if (!clientId || !clientSecret) throw new Error("PayPal is not configured");

  const response = await fetch(`${apiBase()}/v1/oauth2/token`, {
    method: "POST",
    headers: {
      Authorization: `Basic ${Buffer.from(`${clientId}:${clientSecret}`).toString("base64")}`,
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: "grant_type=client_credentials",
    cache: "no-store",
    signal: AbortSignal.timeout(10_000),
  });
  if (!response.ok) throw new Error("PayPal authentication failed");
  const payload = (await response.json()) as { access_token?: string };
  if (!payload.access_token) throw new Error("PayPal returned no access token");
  return payload.access_token;
}

async function paypalRequest<T>(path: string, init: RequestInit): Promise<T> {
  const token = await accessToken();
  const response = await fetch(`${apiBase()}${path}`, {
    ...init,
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
      "PayPal-Request-Id": crypto.randomUUID(),
      ...init.headers,
    },
    cache: "no-store",
    signal: AbortSignal.timeout(15_000),
  });
  if (!response.ok)
    throw new Error(`PayPal request failed (${response.status})`);
  return (await response.json()) as T;
}

export async function createPayPalOrder(input: {
  internalOrderId: string;
  campaignId: string;
  amountUsdCents: number;
}): Promise<PayPalOrder> {
  return paypalRequest<PayPalOrder>("/v2/checkout/orders", {
    method: "POST",
    body: JSON.stringify({
      intent: "CAPTURE",
      purchase_units: [
        {
          reference_id: input.internalOrderId,
          custom_id: input.campaignId,
          amount: {
            currency_code: "USD",
            value: (input.amountUsdCents / 100).toFixed(2),
          },
        },
      ],
    }),
  });
}

export async function capturePayPalOrder(
  orderId: string,
): Promise<PayPalOrder> {
  return paypalRequest<PayPalOrder>(
    `/v2/checkout/orders/${encodeURIComponent(orderId)}/capture`,
    {
      method: "POST",
      body: "{}",
    },
  );
}

export async function verifyPayPalWebhook(
  headers: PayPalWebhookHeaders,
  webhookEvent: unknown,
): Promise<boolean> {
  const webhookId = process.env.PAYPAL_WEBHOOK_ID;
  if (!webhookId) return false;

  const result = await paypalRequest<{ verification_status?: string }>(
    "/v1/notifications/verify-webhook-signature",
    {
      method: "POST",
      body: JSON.stringify({
        auth_algo: headers.authAlgorithm,
        cert_url: headers.certUrl,
        transmission_id: headers.transmissionId,
        transmission_sig: headers.transmissionSignature,
        transmission_time: headers.transmissionTime,
        webhook_id: webhookId,
        webhook_event: webhookEvent,
      }),
    },
  );
  return result.verification_status === "SUCCESS";
}

export async function createPayPalSubscription(input: {
  planId: string;
  internalSubscriptionId: string;
}): Promise<{ id: string; status: string; links?: PayPalLink[] }> {
  return paypalRequest("/v1/billing/subscriptions", {
    method: "POST",
    body: JSON.stringify({
      plan_id: input.planId,
      custom_id: input.internalSubscriptionId,
      application_context: {
        brand_name: "DaanSetu",
        user_action: "SUBSCRIBE_NOW",
        return_url: `${process.env.NEXT_PUBLIC_APP_URL}/dashboard/giving?subscription=approved`,
        cancel_url: `${process.env.NEXT_PUBLIC_APP_URL}/dashboard/giving?subscription=cancelled`,
      },
    }),
  });
}

export async function changePayPalSubscription(
  subscriptionId: string,
  action: "pause" | "resume" | "cancel",
): Promise<void> {
  const endpoint =
    action === "cancel"
      ? "cancel"
      : action === "pause"
        ? "suspend"
        : "activate";
  await paypalRequest(
    `/v1/billing/subscriptions/${encodeURIComponent(subscriptionId)}/${endpoint}`,
    {
      method: "POST",
      body: JSON.stringify({ reason: `DaanSetu donor requested ${action}` }),
    },
  );
}
