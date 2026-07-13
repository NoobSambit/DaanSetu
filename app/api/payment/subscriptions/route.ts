import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

import { rateLimit, RATE_LIMITS } from "@/lib/middleware/rate-limit";
import {
  changePayPalSubscription,
  createPayPalSubscription,
} from "@/lib/payments/paypal";
import { hasValidRequestOrigin } from "@/lib/security/origin";
import { createAdminClient } from "@/lib/supabase/admin";
import { createServerClient } from "@/lib/supabase/server";

const createSchema = z.object({
  action: z.literal("create"),
  campaignId: z.string().uuid(),
  amountPaise: z.number().int().min(100),
  interval: z.enum(["monthly", "quarterly", "yearly"]),
});
const changeSchema = z.object({
  action: z.enum(["pause", "resume", "cancel"]),
  subscriptionId: z.string().uuid(),
});

async function handler(request: NextRequest) {
  if (!hasValidRequestOrigin(request))
    return NextResponse.json(
      { error: "Invalid request origin" },
      { status: 403 },
    );
  const supabase = await createServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user || !user.email_confirmed_at)
    return NextResponse.json(
      { error: "Verified authentication required" },
      { status: 401 },
    );

  const body = await request.json().catch(() => null);
  const createInput = createSchema.safeParse(body);
  const changeInput = changeSchema.safeParse(body);
  const admin = createAdminClient();

  if (createInput.success) {
    const planId =
      process.env[`PAYPAL_PLAN_${createInput.data.interval.toUpperCase()}`];
    if (!planId)
      return NextResponse.json(
        { error: "That giving interval is unavailable" },
        { status: 503 },
      );
    const internalId = crypto.randomUUID();
    const paypal = await createPayPalSubscription({
      planId,
      internalSubscriptionId: internalId,
    });
    const { error } = await admin.from("subscriptions").insert({
      id: internalId,
      donor_id: user.id,
      campaign_id: createInput.data.campaignId,
      amount_paise: createInput.data.amountPaise,
      interval: createInput.data.interval,
      gateway_plan_id: planId,
      gateway_subscription_id: paypal.id,
      status: "created",
    });
    if (error)
      return NextResponse.json(
        { error: "Subscription could not be recorded" },
        { status: 500 },
      );
    return NextResponse.json({
      subscriptionId: internalId,
      approvalUrl:
        paypal.links?.find((link) => link.rel === "approve")?.href ?? null,
    });
  }

  if (changeInput.success) {
    const { data: subscription } = await admin
      .from("subscriptions")
      .select("donor_id, gateway_subscription_id")
      .eq("id", changeInput.data.subscriptionId)
      .maybeSingle();
    if (!subscription || subscription.donor_id !== user.id)
      return NextResponse.json(
        { error: "Subscription not found" },
        { status: 404 },
      );
    await changePayPalSubscription(
      subscription.gateway_subscription_id,
      changeInput.data.action,
    );
    const nextStatus =
      changeInput.data.action === "resume"
        ? "active"
        : changeInput.data.action === "pause"
          ? "paused"
          : "cancelled";
    await admin
      .from("subscriptions")
      .update({
        status: nextStatus,
        cancelled_at:
          nextStatus === "cancelled" ? new Date().toISOString() : null,
      })
      .eq("id", changeInput.data.subscriptionId);
    return NextResponse.json({ success: true, status: nextStatus });
  }

  return NextResponse.json(
    { error: "Invalid subscription request" },
    { status: 400 },
  );
}

export const POST = rateLimit(RATE_LIMITS.PAYMENT)(handler);
