# Testing Guide

Testing strategies and best practices for DaanSetu.

## Testing Philosophy

- Test user-facing behavior, not implementation details
- Prioritize integration tests over unit tests
- Test critical paths (donations, payments, auth)
- Keep tests maintainable and readable

## Testing Stack (Recommended)

```bash
npm install --save-dev \
  @testing-library/react \
  @testing-library/jest-dom \
  @testing-library/user-event \
  jest \
  jest-environment-jsdom
```

## Unit Testing

### Testing Services

```typescript
// __tests__/services/donations.test.ts
import { createDonation } from '@/lib/services/donations'
import { createClient } from '@supabase/supabase-js'

// Mock Supabase
jest.mock('@/lib/supabase', () => ({
  getBrowserClient: () => createClient('mock-url', 'mock-key')
}))

describe('createDonation', () => {
  it('creates donation successfully', async () => {
    const params = {
      ngoId: 'test-ngo-id',
      amount: 1000,
      cause: 'education',
      isAnonymous: false
    }

    const donation = await createDonation(params)

    expect(donation).toBeDefined()
    expect(donation.amount).toBe(1000)
  })

  it('validates minimum amount', async () => {
    const params = {
      ngoId: 'test-ngo-id',
      amount: 5,  // Too low
      cause: 'education',
      isAnonymous: false
    }

    await expect(createDonation(params)).rejects.toThrow(
      'Amount must be greater than 0'
    )
  })
})
```

## Component Testing

### Testing React Components

```typescript
// __tests__/components/DonateButton.test.tsx
import { render, screen, fireEvent } from '@testing-library/react'
import { DonateButton } from '@/components/DonateButton'

describe('DonateButton', () => {
  it('renders with correct text', () => {
    render(<DonateButton amount={1000} />)
    expect(screen.getByText('Donate ₹1,000')).toBeInTheDocument()
  })

  it('calls onClick when clicked', () => {
    const handleClick = jest.fn()
    render(<DonateButton onClick={handleClick} />)

    fireEvent.click(screen.getByText('Donate'))
    expect(handleClick).toHaveBeenCalledTimes(1)
  })

  it('disables button when loading', () => {
    render(<DonateButton loading={true} />)
    expect(screen.getByRole('button')).toBeDisabled()
  })
})
```

## API Route Testing

### Testing Next.js API Routes

```typescript
// __tests__/api/payment/create-order.test.ts
import { POST } from '@/app/api/payment/create-order/route'
import { NextRequest } from 'next/server'

describe('/api/payment/create-order', () => {
  it('creates order successfully', async () => {
    const request = new NextRequest('http://localhost:3000/api/payment/create-order', {
      method: 'POST',
      body: JSON.stringify({
        amount: 1000,
        ngoId: 'test-ngo-id'
      })
    })

    const response = await POST(request)
    const data = await response.json()

    expect(response.status).toBe(200)
    expect(data.orderId).toBeDefined()
  })

  it('validates amount', async () => {
    const request = new NextRequest('http://localhost:3000/api/payment/create-order', {
      method: 'POST',
      body: JSON.stringify({
        amount: -100,  // Invalid
        ngoId: 'test-ngo-id'
      })
    })

    const response = await POST(request)
    expect(response.status).toBe(400)
  })
})
```

## Integration Testing

### Testing Full Flows

```typescript
// __tests__/integration/donation-flow.test.ts
describe('Donation Flow', () => {
  it('completes donation end-to-end', async () => {
    // 1. User navigates to campaign
    const { getByText, getByRole } = render(<CampaignPage id="test-campaign" />)

    // 2. Clicks donate button
    fireEvent.click(getByText('Donate Now'))

    // 3. Enters amount
    const amountInput = getByRole('spinbutton', { name: /amount/i })
    fireEvent.change(amountInput, { target: { value: '1000' } })

    // 4. Submits form
    fireEvent.click(getByText('Proceed to Payment'))

    // 5. Verify order created
    await waitFor(() => {
      expect(screen.getByText('Payment successful')).toBeInTheDocument()
    })
  })
})
```

## E2E Testing (Optional)

### Using Playwright

```bash
npm install --save-dev @playwright/test
npx playwright install
```

```typescript
// e2e/donation.spec.ts
import { test, expect } from '@playwright/test'

test('user can make a donation', async ({ page }) => {
  // Login
  await page.goto('http://localhost:3000/auth/login')
  await page.fill('[name="email"]', 'test@example.com')
  await page.fill('[name="password"]', 'password123')
  await page.click('button[type="submit"]')

  // Navigate to campaign
  await page.goto('http://localhost:3000/campaigns/test-campaign-id')

  // Click donate
  await page.click('text=Donate Now')

  // Fill form
  await page.fill('[name="amount"]', '1000')
  await page.click('text=Proceed to Payment')

  // Verify success
  await expect(page.locator('text=Payment successful')).toBeVisible()
})
```

## Manual Testing Checklist

### Critical Flows

**Donation Flow**:
- [ ] User can create donation
- [ ] Payment processes successfully
- [ ] Campaign amount updates
- [ ] Donation appears in history
- [ ] Badge awarded if applicable

**Authentication**:
- [ ] User can sign up
- [ ] User can log in
- [ ] User can log out
- [ ] Protected routes redirect

**Campaign Management**:
- [ ] NGO can create campaign
- [ ] Campaign displays correctly
- [ ] Deadline validation works
- [ ] Image upload works

## Test Data

### Create Test Users

```sql
-- Create test users in Supabase
INSERT INTO auth.users (email, encrypted_password)
VALUES ('test@example.com', crypt('password123', gen_salt('bf')));

INSERT INTO users (id, email, name, role)
VALUES ('test-user-id', 'test@example.com', 'Test User', 'user');
```

### Test Razorpay Payments

Use test cards in development:
- **Success**: 4111 1111 1111 1111
- **Failure**: 4000 0000 0000 0002

## Continuous Integration

### GitHub Actions (Example)

```yaml
# .github/workflows/test.yml
name: Tests

on: [push, pull_request]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      - uses: actions/setup-node@v2
        with:
          node-version: '18'
      - run: npm install
      - run: npm run lint
      - run: npm test
      - run: npm run build
```

## Best Practices

1. **Test behavior, not implementation**
   - Focus on what users see
   - Don't test internal state

2. **Keep tests simple**
   - One assertion per test (ideally)
   - Clear test names

3. **Use realistic data**
   - Test with real-world values
   - Edge cases matter

4. **Mock external services**
   - Mock Razorpay in tests
   - Mock Gemini AI responses

5. **Run tests before commits**
   ```bash
   git commit -m "feat: add feature"
   # Runs tests automatically
   ```

## Resources

- [Testing Library](https://testing-library.com/)
- [Jest Documentation](https://jestjs.io/)
- [Playwright](https://playwright.dev/)
