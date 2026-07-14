# Payment APIs

## `/api/payment/create-order`

Creates a PayPal order for a one-time donation.

Responsibilities:

- Check authenticated user.
- Validate campaign.
- Validate amount.
- Validate optional CSR attribution.
- Create PayPal order.
- Insert `payment_orders`.

## `/api/payment/capture`

Captures an approved PayPal order.

Responsibilities:

- Find the local payment order.
- Capture the PayPal order.
- Validate provider amount.
- Call `record_completed_payment`.

## `/api/payment/webhook`

Receives PayPal webhooks.

Responsibilities:

- Verify event.
- Store event in `payment_events`.
- Ignore duplicate event IDs.
- Reconcile payment, refund, subscription, payout, and reversal events.

## `/api/payment/subscriptions`

Creates and manages PayPal subscriptions.

Responsibilities:

- Validate plan.
- Validate expected INR paise amount.
- Create subscription.
- Store `subscriptions`.
- Reconcile future invoices through webhook events.

## `/api/demo/payments`

Creates demo-only payment records.

Rules:

- Must not work in production.
- Requires authenticated verified user.
- Marks records as demo.
- Excluded from public financial impact.

