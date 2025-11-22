# Donation System

Complete guide to DaanSetu's donation processing system with Razorpay integration.

## Overview

The donation system handles secure payment processing, campaign tracking, and donation management with features including:

- Razorpay payment integration
- Campaign-specific donations
- Corporate donation matching
- Anonymous donations
- Donation history and analytics
- Automatic badge awarding

## Architecture

```
User → Donation Form → Create Order API → Razorpay → Payment Verification → Database → Success
```

## Core Components

### 1. Donation Service (lib/services/donations.ts)

**Key Functions**:

```typescript
createDonation(params: CreateDonationParams): Promise<Donation>
getUserDonations(): Promise<DonationWithNGO[]>
getDonationStats(): Promise<{totalAmount, totalDonations}>
```

### 2. Payment API Routes

- `/api/payment/create-order` - Creates Razorpay order
- `/api/payment/verify` - Verifies payment and creates donation

### 3. Database Tables

- `donations` - Donation records
- `campaigns` - Fundraising campaigns
- `activity_logs` - Activity tracking

## Donation Flow

### Step 1: User Initiates Donation

```typescript
// components/DonateButton.tsx
const handleDonate = async () => {
  // Validate amount
  if (amount < 10) {
    alert('Minimum donation: ₹10')
    return
  }

  // Create order
  const orderRes = await fetch('/api/payment/create-order', {
    method: 'POST',
    body: JSON.stringify({
      amount,
      ngoId,
      campaignId
    })
  })

  const { orderId, keyId } = await orderRes.json()
  // Continue to Razorpay...
}
```

### Step 2: Create Razorpay Order

```typescript
// app/api/payment/create-order/route.ts
const order = await razorpay.orders.create({
  amount: amount * 100,  // Convert to paise
  currency: 'INR',
  receipt: `receipt_${Date.now()}`
})

return NextResponse.json({
  orderId: order.id,
  amount: order.amount,
  keyId: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID
})
```

### Step 3: Razorpay Payment Modal

```typescript
const options = {
  key: keyId,
  amount: orderAmount,
  order_id: orderId,
  handler: async function(response) {
    // Payment successful - verify
    await verifyPayment(response)
  },
  theme: {
    color: '#3B82F6'
  }
}

const razorpay = new Razorpay(options)
razorpay.open()
```

### Step 4: Verify Payment

```typescript
// app/api/payment/verify/route.ts
import crypto from 'crypto'

// Verify signature
const sign = razorpay_order_id + '|' + razorpay_payment_id
const expectedSign = crypto
  .createHmac('sha256', RAZORPAY_KEY_SECRET)
  .update(sign)
  .digest('hex')

if (razorpay_signature !== expectedSign) {
  return NextResponse.json({ error: 'Invalid signature' }, { status: 400 })
}
```

### Step 5: Create Donation Record

```typescript
// lib/services/donations.ts
const { data } = await supabase
  .from('donations')
  .insert({
    user_id: user.id,
    ngo_id: params.ngoId,
    campaign_id: params.campaignId,
    amount: params.amount,
    cause: params.cause,
    is_anonymous: params.isAnonymous,
    payment_status: 'completed'
  })
  .select()
  .single()
```

### Step 6: Update Campaign (Atomic)

```typescript
if (params.campaignId) {
  await supabase.rpc('increment_campaign_amount', {
    campaign_id: params.campaignId,
    amount_to_add: params.amount
  })
}
```

**Why Atomic?**
Prevents race conditions when multiple donations happen simultaneously.

### Step 7: Log Activity & Award Badges

```typescript
// Log activity
await supabase.rpc('log_activity', {
  p_user_id: user.id,
  p_activity_type: 'donation',
  p_description: `Donated ₹${amount}`
})

// Badge awarding happens via database trigger
```

## Donation Types

### Regular Donation

```typescript
const donation = await createDonation({
  ngoId: 'uuid',
  amount: 1000,
  cause: 'education',
  isAnonymous: false
})
```

### Campaign Donation

```typescript
const donation = await createDonation({
  ngoId: 'uuid',
  campaignId: 'campaign-uuid',
  amount: 5000,
  cause: 'education',
  isAnonymous: false
})

// Campaign's current_amount automatically updated
```

### Anonymous Donation

```typescript
const donation = await createDonation({
  ngoId: 'uuid',
  amount: 2000,
  cause: 'health',
  isAnonymous: true  // Donor name hidden from NGO
})
```

### Corporate Donation

```typescript
const donation = await createDonation({
  ngoId: 'uuid',
  amount: 10000,
  cause: 'education',
  isAnonymous: false,
  corporateCampaignId: 'corp-campaign-uuid'
})

// Corporate matching applied automatically
```

## Donation Causes

```typescript
type DonationCause =
  | 'education'
  | 'hunger'
  | 'healthcare'
  | 'disaster'
  | 'general'
```

## Amount Limits

```typescript
const MIN_DONATION = 10        // ₹10
const MAX_DONATION = 10000000  // ₹1,00,00,000
```

## Donation History

### Get User Donations

```typescript
const donations = await getUserDonations()

// Returns:
[
  {
    id: 'uuid',
    amount: 1000,
    cause: 'education',
    created_at: '2024-01-01',
    ngo: {
      id: 'uuid',
      name: 'Education for All',
      category: 'education'
    }
  }
]
```

### Get Donation Stats

```typescript
const stats = await getDonationStats()

// Returns:
{
  totalAmount: 50000,
  totalDonations: 25
}
```

## Database Schema

```sql
CREATE TABLE donations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id),
  ngo_id UUID NOT NULL REFERENCES ngos(id),
  campaign_id UUID REFERENCES campaigns(id),
  corporate_campaign_id UUID REFERENCES corporate_campaigns(id),
  amount DECIMAL(10, 2) NOT NULL CHECK (amount > 0),
  cause TEXT NOT NULL CHECK (cause IN ('education', 'hunger', 'healthcare', 'disaster', 'general')),
  is_anonymous BOOLEAN NOT NULL DEFAULT false,
  payment_status TEXT NOT NULL DEFAULT 'completed',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

## RLS Policies

```sql
-- Users can view their own donations
CREATE POLICY "users_view_own" ON donations
  FOR SELECT TO authenticated
  USING (auth.uid() = user_id);

-- NGOs can view donations made to them
CREATE POLICY "ngos_view_donations" ON donations
  FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM ngos
      WHERE ngos.id = donations.ngo_id
      AND ngos.user_id = auth.uid()
    )
  );

-- Authenticated users can create donations
CREATE POLICY "users_create" ON donations
  FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);
```

## Testing

### Test Cards (Razorpay Test Mode)

| Card | Result |
|------|--------|
| 4111 1111 1111 1111 | Success |
| 4000 0000 0000 0002 | Failure |

### Test Donation Flow

```bash
# 1. Create order
curl -X POST http://localhost:3000/api/payment/create-order \
  -H "Content-Type: application/json" \
  -d '{"amount": 100, "ngoId": "uuid"}'

# 2. Complete payment in Razorpay modal (use test card)

# 3. Verify payment
curl -X POST http://localhost:3000/api/payment/verify \
  -H "Content-Type: application/json" \
  -d '{
    "razorpay_order_id": "...",
    "razorpay_payment_id": "...",
    "razorpay_signature": "...",
    "ngoId": "uuid",
    "amount": 100,
    "cause": "education",
    "isAnonymous": false
  }'
```

## Error Handling

```typescript
try {
  const donation = await createDonation(params)
} catch (error) {
  if (error.message.includes('must be logged in')) {
    // Redirect to login
  } else if (error.message.includes('Invalid signature')) {
    // Payment verification failed
  } else {
    // Generic error
    console.error('Donation failed:', error)
  }
}
```

## Analytics

### Total Donations by NGO

```typescript
const { data } = await supabase
  .from('donations')
  .select('amount')
  .eq('ngo_id', ngoId)

const total = data.reduce((sum, d) => sum + d.amount, 0)
```

### Donations Over Time

```typescript
const { data } = await supabase
  .from('donations')
  .select('created_at, amount')
  .gte('created_at', startDate)
  .lte('created_at', endDate)
  .order('created_at')
```

## Best Practices

1. **Always verify payments server-side** - Never trust client
2. **Use atomic updates** for campaign amounts
3. **Log all transactions** for audit trail
4. **Handle errors gracefully** - Show user-friendly messages
5. **Test thoroughly** with test cards before going live
6. **Monitor payment failures** and investigate patterns

## Next Steps

- [Payment API](../api/payment.md) - Payment API reference
- [Campaign Management](./campaigns.md) - Campaign features
- [Corporate CSR](./corporate-csr.md) - Corporate donations

## Resources

- [Razorpay Docs](https://razorpay.com/docs/)
- [Payment Security](https://razorpay.com/docs/payments/security/)
