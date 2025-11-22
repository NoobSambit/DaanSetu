# Payment API

DaanSetu integrates with Razorpay for secure payment processing.

## Overview

**Base Path**: `/api/payment/`

**Rate Limit**: 30 requests per minute

**Authentication**: Required

## Payment Flow

```
1. User clicks "Donate"
   ↓
2. Frontend calls /api/payment/create-order
   ↓
3. API creates Razorpay order
   ↓
4. Razorpay payment modal opens
   ↓
5. User completes payment
   ↓
6. Razorpay returns payment details
   ↓
7. Frontend calls /api/payment/verify
   ↓
8. API verifies signature
   ↓
9. Create donation record in database
   ↓
10. Update campaign amount (atomic)
    ↓
11. Return success to frontend
```

## Create Order

Creates a Razorpay order for payment processing.

### Endpoint
```
POST /api/payment/create-order
```

### Authentication
Required

### Request Body
```typescript
{
  amount: number         // Amount in rupees (e.g., 1000 for ₹1,000)
  currency?: string      // Default: 'INR'
  ngoId: string         // NGO to donate to
  campaignId?: string   // Optional campaign ID
}
```

### Example Request

```bash
curl -X POST http://localhost:3000/api/payment/create-order \
  -H "Content-Type: application/json" \
  -H "Cookie: auth-token=..." \
  -d '{
    "amount": 1000,
    "ngoId": "uuid",
    "campaignId": "uuid"
  }'
```

### Example Response

```json
{
  "orderId": "order_MN1234567890",
  "amount": 100000,
  "currency": "INR",
  "keyId": "rzp_test_xxxxx"
}
```

**Note**: Amount in response is in paise (₹1,000 = 100000 paise)

### Implementation

```typescript
// app/api/payment/create-order/route.ts
import Razorpay from 'razorpay'

const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID!,
  key_secret: process.env.RAZORPAY_KEY_SECRET!
})

export async function POST(request: NextRequest) {
  const { amount, ngoId } = await request.json()

  // Validate amount
  if (amount < 10 || amount > 10000000) {
    return NextResponse.json(
      { error: 'Amount must be between ₹10 and ₹1,00,00,000' },
      { status: 400 }
    )
  }

  // Create Razorpay order
  const order = await razorpay.orders.create({
    amount: amount * 100, // Convert to paise
    currency: 'INR',
    receipt: `receipt_${Date.now()}_${ngoId.substring(0, 8)}`,
    notes: {
      ngoId,
      campaignId: campaignId || ''
    }
  })

  return NextResponse.json({
    orderId: order.id,
    amount: order.amount,
    currency: order.currency,
    keyId: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID
  })
}
```

## Verify Payment

Verifies payment signature and creates donation record.

### Endpoint
```
POST /api/payment/verify
```

### Authentication
Required

### Request Body
```typescript
{
  razorpay_order_id: string
  razorpay_payment_id: string
  razorpay_signature: string
  ngoId: string
  amount: number
  cause: 'education' | 'hunger' | 'healthcare' | 'disaster' | 'general'
  isAnonymous: boolean
  campaignId?: string
  corporateCampaignId?: string
}
```

### Example Request

```bash
curl -X POST http://localhost:3000/api/payment/verify \
  -H "Content-Type: application/json" \
  -H "Cookie: auth-token=..." \
  -d '{
    "razorpay_order_id": "order_MN1234567890",
    "razorpay_payment_id": "pay_MN1234567890",
    "razorpay_signature": "abc123...",
    "ngoId": "uuid",
    "amount": 1000,
    "cause": "education",
    "isAnonymous": false
  }'
```

### Example Response

```json
{
  "success": true,
  "donation": {
    "id": "uuid",
    "amount": 1000,
    "ngo_id": "uuid",
    "campaign_id": "uuid",
    "created_at": "2024-01-01T00:00:00Z"
  }
}
```

### Signature Verification

```typescript
import crypto from 'crypto'

// Verify Razorpay signature
const sign = razorpay_order_id + '|' + razorpay_payment_id

const expectedSign = crypto
  .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET!)
  .update(sign)
  .digest('hex')

if (razorpay_signature !== expectedSign) {
  return NextResponse.json(
    { error: 'Invalid payment signature' },
    { status: 400 }
  )
}

// Signature valid - create donation
const donation = await createDonation({
  ngoId,
  amount,
  cause,
  isAnonymous,
  campaignId
}, supabase)
```

### Database Operations

After verification, the API:

1. **Creates donation record**:
```typescript
const { data } = await supabase
  .from('donations')
  .insert({
    user_id: user.id,
    ngo_id: ngoId,
    campaign_id: campaignId,
    amount: amount,
    payment_status: 'completed'
  })
```

2. **Updates campaign amount** (atomic):
```typescript
if (campaignId) {
  await supabase.rpc('increment_campaign_amount', {
    campaign_id: campaignId,
    amount_to_add: amount
  })
}
```

3. **Logs activity**:
```typescript
await supabase.rpc('log_activity', {
  p_user_id: user.id,
  p_activity_type: 'donation',
  p_description: `Donated ₹${amount} to ${ngoName}`
})
```

4. **Triggers badge check** (via database trigger)

## Client-Side Integration

### Frontend Code

```typescript
// components/DonateButton.tsx
'use client'

import { useState } from 'react'

export function DonateButton({ ngoId, campaignId }) {
  const [loading, setLoading] = useState(false)

  const handleDonate = async (amount: number) => {
    setLoading(true)

    try {
      // Step 1: Create order
      const orderRes = await fetch('/api/payment/create-order', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ amount, ngoId, campaignId })
      })

      const { orderId, amount: orderAmount, keyId } = await orderRes.json()

      // Step 2: Open Razorpay
      const options = {
        key: keyId,
        amount: orderAmount,
        currency: 'INR',
        name: 'DaanSetu',
        description: 'Donation',
        order_id: orderId,
        handler: async function (response: any) {
          // Step 3: Verify payment
          const verifyRes = await fetch('/api/payment/verify', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              razorpay_order_id: response.razorpay_order_id,
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_signature: response.razorpay_signature,
              ngoId,
              campaignId,
              amount,
              cause: 'education',
              isAnonymous: false
            })
          })

          const { success } = await verifyRes.json()

          if (success) {
            alert('Donation successful!')
            router.push('/dashboard')
          }
        },
        prefill: {
          name: user.name,
          email: user.email
        },
        theme: {
          color: '#3B82F6'
        }
      }

      const razorpay = new (window as any).Razorpay(options)
      razorpay.open()
    } catch (error) {
      console.error('Payment error:', error)
      alert('Payment failed. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <button onClick={() => handleDonate(1000)} disabled={loading}>
      {loading ? 'Processing...' : 'Donate ₹1,000'}
    </button>
  )
}
```

### Add Razorpay Script

```typescript
// app/layout.tsx
export default function RootLayout({ children }) {
  return (
    <html>
      <head>
        <script src="https://checkout.razorpay.com/v1/checkout.js"></script>
      </head>
      <body>{children}</body>
    </html>
  )
}
```

## Test Mode

### Test Credentials

For development, use Razorpay test mode:

```bash
# .env
RAZORPAY_KEY_ID=rzp_test_xxxxxxxxxxxxx
RAZORPAY_KEY_SECRET=xxxxxxxxxxxxxxxxxxxxxxx
NEXT_PUBLIC_RAZORPAY_KEY_ID=rzp_test_xxxxxxxxxxxxx
```

### Test Cards

| Card Number | CVV | Expiry | Result |
|-------------|-----|--------|--------|
| 4111 1111 1111 1111 | 123 | Any future | Success |
| 4012 8888 8888 1881 | 123 | Any future | Success |
| 5555 5555 5555 4444 | 123 | Any future | Success |
| 4000 0000 0000 0002 | 123 | Any future | Failure |

## Production Setup

### Switch to Live Mode

1. Get live keys from Razorpay dashboard
2. Update `.env`:
```bash
RAZORPAY_KEY_ID=rzp_live_xxxxxxxxxxxxx
RAZORPAY_KEY_SECRET=xxxxxxxxxxxxxxxxxxxxxxx
NEXT_PUBLIC_RAZORPAY_KEY_ID=rzp_live_xxxxxxxxxxxxx
```

3. Test thoroughly before going live!

### Webhooks (Optional)

For production, set up webhooks for additional security:

```typescript
// app/api/payment/webhook/route.ts
import crypto from 'crypto'

export async function POST(request: NextRequest) {
  const body = await request.text()
  const signature = request.headers.get('x-razorpay-signature')

  // Verify webhook signature
  const expectedSignature = crypto
    .createHmac('sha256', process.env.RAZORPAY_WEBHOOK_SECRET!)
    .update(body)
    .digest('hex')

  if (signature !== expectedSignature) {
    return NextResponse.json({ error: 'Invalid signature' }, { status: 400 })
  }

  const event = JSON.parse(body)

  if (event.event === 'payment.captured') {
    // Handle successful payment
    const payment = event.payload.payment.entity
    console.log('Payment captured:', payment.id)
  }

  return NextResponse.json({ success: true })
}
```

## Error Handling

### Common Errors

**Amount validation error**:
```json
{
  "error": "Amount must be between ₹10 and ₹1,00,00,000"
}
```

**Invalid signature**:
```json
{
  "error": "Invalid payment signature"
}
```

**Payment failed**:
```json
{
  "error": "Payment verification failed"
}
```

### Retry Logic

```typescript
const handlePaymentError = (error: any) => {
  if (error.code === 'PAYMENT_FAILED') {
    // User can retry
    alert('Payment failed. Please try again.')
  } else if (error.code === 'NETWORK_ERROR') {
    // Network issue
    alert('Network error. Please check your connection.')
  } else {
    // Other errors
    alert('Payment failed. Please contact support.')
  }
}
```

## Security Best Practices

1. **Always verify signature** on server-side
2. **Never trust client** - re-validate amount on server
3. **Use HTTPS** in production
4. **Keep secrets secure** - never expose `RAZORPAY_KEY_SECRET`
5. **Log all transactions** for audit trail
6. **Handle errors gracefully** - don't expose internal errors

## Next Steps

- [Social API](./social.md) - Social features API
- [Donation Features](../features/donations.md) - Donation system details
- [Security Guide](../security/overview.md) - Security best practices

## Resources

- [Razorpay Documentation](https://razorpay.com/docs/)
- [Razorpay Test Cards](https://razorpay.com/docs/payments/payments/test-card-details/)
- [Payment Security](https://razorpay.com/docs/payments/security/)
