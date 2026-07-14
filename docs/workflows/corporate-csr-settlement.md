# Corporate CSR Settlement Workflow

CSR settlement turns employee-attributed match pledges into actual matched donations.

## Setup

1. Corporate user creates a corporate profile.
2. Corporate user invites employees.
3. Corporate user creates CSR campaigns.
4. Corporate user creates CSR match initiatives.
5. Employees or attributed supporters donate.
6. Eligible donations create `csr_match_pledges`.

## Partnership Requests

1. Corporate user creates a partnership request with a verified NGO.
2. NGO or corporate owner reviews relevant requests.
3. Decision uses `review_partnership_request`.
4. Notifications and audit records are created.

## Settlement Creation

1. Corporate user opens `/corporate/settlements`.
2. User selects outstanding pledges.
3. Browser calls `/api/csr/settlements`.
4. Server validates corporate ownership.
5. Server calls `create_csr_settlement_batch`.
6. Server creates PayPal order.
7. User is sent to PayPal.

## Settlement Capture

1. PayPal redirects to `/corporate/settlements/paypal-return`.
2. Return page sends same-origin POST to `/api/csr/settlements/capture`.
3. Server rate-limits and validates origin.
4. Server captures the PayPal order.
5. Server calls `capture_csr_settlement`.
6. Database allocates matched donations.
7. Settlement and pledge states are updated.

## Cancellation

If the user cancels:

1. User lands on `/corporate/settlements/paypal-cancel`.
2. Pending settlement can be cancelled.
3. `cancel_csr_settlement` releases pledges.

## Reversal

If PayPal later reverses a settlement payment:

1. Webhook receives provider event.
2. Server calls `reverse_csr_settlement`.
3. Matched donation records and pledges are reversed.

## Rules

- Settlement capture is a POST, not GET.
- Capture must validate provider totals.
- Outstanding pledges should not be double-settled.
- Reversed settlements must release or reverse related records.

