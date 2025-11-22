# Coding Standards

Code style guide and best practices for DaanSetu development.

## TypeScript

### Always Use TypeScript

```typescript
// ✅ Good - Explicit types
interface DonationParams {
  ngoId: string
  amount: number
  cause: DonationCause
}

function createDonation(params: DonationParams): Promise<Donation> {
  // ...
}

// ❌ Bad - No types
function createDonation(params) {
  // ...
}
```

### Use Type Inference

```typescript
// ✅ Good - Let TypeScript infer
const amount = 1000  // inferred as number
const donations = await getDonations()  // inferred from return type

// ❌ Bad - Redundant type annotation
const amount: number = 1000
```

### Avoid `any`

```typescript
// ❌ Bad
const data: any = await fetch(...)

// ✅ Good
interface APIResponse {
  data: Campaign[]
  error?: string
}

const data: APIResponse = await fetch(...)
```

## React Components

### Server Components by Default

```typescript
// ✅ Good - Server component (default)
export default async function CampaignsPage() {
  const campaigns = await getCampaigns()
  return <CampaignList campaigns={campaigns} />
}

// Only use 'use client' when needed
'use client'
export function DonateButton() {
  const [loading, setLoading] = useState(false)
  // ...
}
```

### Component Naming

```typescript
// ✅ Good - PascalCase
export function DonateButton() { }
export function CampaignCard() { }

// ❌ Bad
export function donateButton() { }
export function campaign_card() { }
```

### Props Interface

```typescript
// ✅ Good - Named interface
interface CampaignCardProps {
  campaign: Campaign
  showDonateButton?: boolean
}

export function CampaignCard({ campaign, showDonateButton = true }: CampaignCardProps) {
  // ...
}

// ❌ Bad - Inline types
export function CampaignCard({ campaign, showDonateButton }: {
  campaign: any
  showDonateButton?: boolean
}) { }
```

## API Routes

### Use Descriptive Names

```typescript
// ✅ Good
export async function POST(request: NextRequest) {
  // Clear what this does
}

// File: app/api/payment/create-order/route.ts
```

### Always Type Request/Response

```typescript
// ✅ Good
interface CreateOrderRequest {
  amount: number
  ngoId: string
}

interface CreateOrderResponse {
  orderId: string
  amount: number
}

export async function POST(request: NextRequest) {
  const body: CreateOrderRequest = await request.json()

  // ...

  return NextResponse.json<CreateOrderResponse>({
    orderId: order.id,
    amount: order.amount
  })
}
```

### Handle Errors Consistently

```typescript
// ✅ Good - Consistent error handling
export async function POST(request: NextRequest) {
  try {
    // Validation
    if (!amount || amount < 10) {
      return NextResponse.json(
        { error: 'Invalid amount', message: 'Amount must be at least ₹10' },
        { status: 400 }
      )
    }

    // Operation
    const result = await createOrder(amount)

    return NextResponse.json({ data: result })
  } catch (error) {
    console.error('Create order error:', error)
    return NextResponse.json(
      { error: 'Internal server error', message: 'Failed to create order' },
      { status: 500 }
    )
  }
}
```

## Naming Conventions

### Variables

```typescript
// ✅ Good - camelCase
const donationAmount = 1000
const campaignList = []
const isLoading = false

// ❌ Bad
const DonationAmount = 1000
const campaign_list = []
```

### Constants

```typescript
// ✅ Good - UPPER_SNAKE_CASE
const MAX_DONATION_AMOUNT = 10000000
const MIN_PASSWORD_LENGTH = 6

// Also acceptable for objects
const RATE_LIMITS = {
  AI: { windowMs: 60000, maxRequests: 10 }
}
```

### Functions

```typescript
// ✅ Good - Descriptive verb + noun
function createDonation() { }
function getUserDonations() { }
function validateCampaignData() { }

// ❌ Bad - Vague
function process() { }
function data() { }
function handle() { }
```

## Code Style

### Async/Await over Promises

```typescript
// ✅ Good
async function getDonations() {
  const { data, error } = await supabase.from('donations').select('*')
  if (error) throw error
  return data
}

// ❌ Bad
function getDonations() {
  return supabase
    .from('donations')
    .select('*')
    .then(({ data, error }) => {
      if (error) throw error
      return data
    })
}
```

### Early Returns

```typescript
// ✅ Good - Early returns
function processPayment(amount: number) {
  if (!amount) return { error: 'Amount required' }
  if (amount < 10) return { error: 'Amount too small' }
  if (amount > 1000000) return { error: 'Amount too large' }

  // Main logic here
  return processRazorpayPayment(amount)
}

// ❌ Bad - Nested conditions
function processPayment(amount: number) {
  if (amount) {
    if (amount >= 10) {
      if (amount <= 1000000) {
        // Main logic buried deep
        return processRazorpayPayment(amount)
      } else {
        return { error: 'Amount too large' }
      }
    } else {
      return { error: 'Amount too small' }
    }
  } else {
    return { error: 'Amount required' }
  }
}
```

### Destructuring

```typescript
// ✅ Good - Destructure
const { name, email, role } = user
const { data, error } = await supabase.from('campaigns').select('*')

// ❌ Bad
const name = user.name
const email = user.email
const role = user.role
```

## Comments

### When to Comment

```typescript
// ✅ Good - Explain WHY, not WHAT
// Use atomic operation to prevent race conditions when multiple donations occur simultaneously
await supabase.rpc('increment_campaign_amount', { campaign_id, amount })

// ✅ Good - Complex business logic
// Calculate matching amount: Corporate matches 50% of employee donations up to ₹10,000
const matchingAmount = Math.min(donationAmount * 0.5, 10000)
```

### When NOT to Comment

```typescript
// ❌ Bad - Obvious
// Get user ID
const userId = user.id

// ❌ Bad - Outdated or wrong
// TODO: Fix this later (2022)
```

## Testing

### Test File Naming

```
src/services/donations.ts
→ __tests__/services/donations.test.ts
```

### Test Structure

```typescript
describe('createDonation', () => {
  it('should create a donation successfully', async () => {
    const donation = await createDonation({
      ngoId: 'test-ngo',
      amount: 1000,
      cause: 'education',
      isAnonymous: false
    })

    expect(donation).toBeDefined()
    expect(donation.amount).toBe(1000)
  })

  it('should throw error for invalid amount', async () => {
    await expect(
      createDonation({
        ngoId: 'test-ngo',
        amount: -100,
        cause: 'education',
        isAnonymous: false
      })
    ).rejects.toThrow('Amount must be greater than 0')
  })
})
```

## Git Commit Messages

### Format

```
type(scope): subject

body (optional)
```

### Examples

```bash
# ✅ Good
feat(payments): add Razorpay payment verification
fix(campaigns): prevent race condition in amount updates
docs(api): update payment endpoint documentation
refactor(donations): simplify donation creation logic

# ❌ Bad
updated stuff
fix bug
WIP
```

### Types

- `feat`: New feature
- `fix`: Bug fix
- `docs`: Documentation
- `refactor`: Code refactoring
- `test`: Tests
- `chore`: Build/tooling

## File Organization

### One Component Per File

```typescript
// ✅ Good
// components/DonateButton.tsx
export function DonateButton() { }

// components/CampaignCard.tsx
export function CampaignCard() { }

// ❌ Bad - Multiple components in one file
// components/Campaign.tsx
export function CampaignCard() { }
export function CampaignList() { }
export function CampaignDetails() { }
```

### Export Pattern

```typescript
// ✅ Good - Named exports for utilities
export function createDonation() { }
export function getDonations() { }

// ✅ Good - Default export for components
export default function CampaignsPage() { }

// ❌ Bad - Default export for utilities
export default { createDonation, getDonations }
```

## Formatting

Use Prettier (or equivalent) for consistent formatting:

```bash
npm install --save-dev prettier
npx prettier --write .
```

## ESLint

Enable Next.js ESLint:

```bash
npm run lint
```

Fix warnings before committing.

## Resources

- [TypeScript Best Practices](https://www.typescriptlang.org/docs/handbook/declaration-files/do-s-and-don-ts.html)
- [React TypeScript Cheatsheet](https://react-typescript-cheatsheet.netlify.app/)
- [Next.js Best Practices](https://nextjs.org/docs/app/building-your-application)
