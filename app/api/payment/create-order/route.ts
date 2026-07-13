import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase/server";
import Razorpay from "razorpay";
import { rateLimit, RATE_LIMITS } from "@/lib/middleware/rate-limit";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

/**
 * Create a Razorpay order for donation payment
 * POST /api/payment/create-order
 */
async function handler(request: NextRequest) {
  try {
    const supabase = await createServerClient();

    // Check authentication
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Parse request body
    const body = await request.json();
    const { amount, ngoId, campaignId, corporateCampaignId } = body;

    // Validate amount
    if (!amount || amount <= 0) {
      return NextResponse.json(
        { error: "Invalid donation amount" },
        { status: 400 },
      );
    }

    if (amount > 100000000) {
      return NextResponse.json(
        { error: "Amount cannot exceed ₹1,00,00,000" },
        { status: 400 },
      );
    }

    // Validate that at least ngoId is provided
    if (!ngoId) {
      return NextResponse.json(
        { error: "NGO ID is required" },
        { status: 400 },
      );
    }

    // Check if Razorpay is configured
    const razorpayKeyId = process.env.RAZORPAY_KEY_ID;
    const razorpayKeySecret = process.env.RAZORPAY_KEY_SECRET;

    if (!razorpayKeyId || !razorpayKeySecret) {
      console.error("Razorpay credentials not configured");
      return NextResponse.json(
        { error: "Payment gateway not configured. Please contact support." },
        { status: 503 },
      );
    }

    // Initialize Razorpay
    const razorpay = new Razorpay({
      key_id: razorpayKeyId,
      key_secret: razorpayKeySecret,
    });

    // Create Razorpay order
    const order = await razorpay.orders.create({
      amount: amount * 100, // Razorpay expects amount in paise
      currency: "INR",
      receipt: `receipt_${user.id}_${Date.now()}`,
      notes: {
        userId: user.id,
        ngoId,
        campaignId: campaignId || "",
        corporateCampaignId: corporateCampaignId || "",
      },
    });

    return NextResponse.json({
      orderId: order.id,
      amount: order.amount,
      currency: order.currency,
      keyId: razorpayKeyId,
    });
  } catch (error) {
    console.error("Error creating payment order:", error);
    return NextResponse.json(
      { error: "Failed to create payment order" },
      { status: 500 },
    );
  }
}

export const POST = rateLimit(RATE_LIMITS.PAYMENT)(handler);
