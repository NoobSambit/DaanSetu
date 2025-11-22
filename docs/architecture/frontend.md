# Frontend Architecture

DaanSetu's frontend is built with Next.js 14 App Router, React 18, and Tailwind CSS, following modern React patterns and best practices.

## Directory Structure

```
app/
├── (auth)/              # Authentication pages (grouped route)
│   ├── login/
│   └── signup/
├── api/                 # API routes (server-side)
├── campaigns/           # Campaign pages
│   ├── page.tsx        # List campaigns
│   ├── create/         # Create campaign
│   ├── [id]/           # Campaign details (dynamic route)
│   └── components/     # Campaign-specific components
├── ngos/               # NGO directory
├── dashboard/          # User dashboard
├── community/          # Social feed
├── volunteer/          # Volunteer section
├── corporate/          # Corporate CSR
├── leaderboard/        # Gamification
├── layout.tsx          # Root layout
├── page.tsx            # Homepage
└── globals.css         # Global styles

components/
├── ErrorBoundary.tsx   # Error handling
├── Navbar.tsx          # Navigation
├── Footer.tsx          # Footer
└── ui/                 # Reusable UI components
    ├── Button.tsx
    ├── Card.tsx
    ├── Modal.tsx
    └── ...
```

## App Router Conventions

### Server vs Client Components

DaanSetu follows Next.js App Router best practices:

**Server Components (Default)**: No `'use client'` directive

```typescript
// app/campaigns/page.tsx
export default async function CampaignsPage() {
  // Fetch data server-side
  const { data: campaigns } = await supabase
    .from('campaigns')
    .select('*')

  return <CampaignList campaigns={campaigns} />
}
```

**Benefits**:
- Zero JavaScript sent to client for static content
- Direct database access (no API route needed)
- SEO-friendly
- Better performance

**Client Components**: Use `'use client'` when needed

```typescript
// components/DonateButton.tsx
'use client'

import { useState } from 'react'

export function DonateButton() {
  const [loading, setLoading] = useState(false)

  const handleClick = async () => {
    // Interactive logic
  }

  return <button onClick={handleClick}>Donate</button>
}
```

**Use client components for**:
- Event handlers (onClick, onChange)
- React hooks (useState, useEffect)
- Browser APIs (localStorage, window)
- Third-party libraries requiring browser environment

### File-Based Routing

| File | Purpose | Example |
|------|---------|---------|
| `page.tsx` | Page component | `campaigns/page.tsx` → `/campaigns` |
| `layout.tsx` | Shared layout | `campaigns/layout.tsx` wraps all campaign pages |
| `loading.tsx` | Loading UI | Shown while page loads |
| `error.tsx` | Error boundary | Catches errors in page |
| `not-found.tsx` | 404 page | Custom 404 for section |

### Dynamic Routes

```
campaigns/[id]/page.tsx → /campaigns/abc-123

// Access params:
export default function CampaignPage({
  params
}: {
  params: { id: string }
}) {
  const campaignId = params.id
  // ...
}
```

## Component Patterns

### 1. Server Component Data Fetching

```typescript
// app/ngos/page.tsx
import { createServerClient } from '@/lib/supabase/server'

export default async function NGOsPage() {
  const supabase = createServerClient()

  const { data: ngos } = await supabase
    .from('ngos')
    .select('*')
    .order('created_at', { ascending: false })

  return (
    <div>
      {ngos?.map(ngo => (
        <NGOCard key={ngo.id} ngo={ngo} />
      ))}
    </div>
  )
}
```

**Benefits**:
- No loading states needed
- No API route required
- Data available on first render

### 2. Client Component with State

```typescript
// app/campaigns/components/AICampaignSuggestions.tsx
'use client'

import { useState, useEffect } from 'react'

export function AICampaignSuggestions() {
  const [suggestions, setSuggestions] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function fetchSuggestions() {
      const res = await fetch('/api/ai/recommend-campaigns')
      const data = await res.json()
      setSuggestions(data)
      setLoading(false)
    }
    fetchSuggestions()
  }, [])

  if (loading) return <Skeleton />

  return (
    <div>
      {suggestions.map(s => (
        <SuggestionCard key={s.id} suggestion={s} />
      ))}
    </div>
  )
}
```

### 3. Hybrid Approach

Combine server and client components:

```typescript
// app/campaigns/[id]/page.tsx (Server Component)
export default async function CampaignPage({ params }) {
  // Fetch data server-side
  const campaign = await getCampaign(params.id)

  return (
    <div>
      {/* Static content (server-rendered) */}
      <h1>{campaign.title}</h1>
      <p>{campaign.description}</p>

      {/* Interactive component (client-side) */}
      <DonateButton campaignId={campaign.id} />

      {/* Another client component */}
      <CommentSection campaignId={campaign.id} />
    </div>
  )
}
```

## State Management

DaanSetu uses minimal state management, relying on React's built-in features:

### 1. Component State (useState)

For local UI state:

```typescript
const [isOpen, setIsOpen] = useState(false)
const [formData, setFormData] = useState({ name: '', email: '' })
```

### 2. Server State (Supabase)

Database is the source of truth. No Redux/Zustand needed:

```typescript
// Fetch fresh data from server
const { data } = await supabase.from('campaigns').select('*')

// Update in database
await supabase.from('campaigns').update({ status: 'completed' })

// Real-time subscriptions
supabase
  .channel('campaigns')
  .on('postgres_changes', { event: '*', schema: 'public', table: 'campaigns' },
    payload => {
      // Update UI
    }
  )
  .subscribe()
```

### 3. URL State (searchParams)

For shareable/bookmarkable state:

```typescript
// app/campaigns/page.tsx
export default function CampaignsPage({
  searchParams
}: {
  searchParams: { category?: string }
}) {
  const category = searchParams.category // From ?category=education

  // Filter based on URL param
  const { data } = await supabase
    .from('campaigns')
    .select('*')
    .eq('category', category)
}
```

## Data Fetching Strategies

### 1. Server Component Fetching (Preferred)

```typescript
export default async function Page() {
  const data = await fetchData() // Runs on server
  return <View data={data} />
}
```

### 2. Client-Side Fetching

```typescript
'use client'

export function Component() {
  const [data, setData] = useState(null)

  useEffect(() => {
    fetch('/api/data')
      .then(res => res.json())
      .then(setData)
  }, [])

  return data ? <View data={data} /> : <Loading />
}
```

### 3. Real-Time Subscriptions

```typescript
'use client'

export function LiveFeed() {
  const [posts, setPosts] = useState([])

  useEffect(() => {
    const channel = supabase
      .channel('posts')
      .on('postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'posts' },
        payload => {
          setPosts(prev => [payload.new, ...prev])
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [])

  return <PostList posts={posts} />
}
```

## Styling with Tailwind CSS

### Utility-First Approach

```typescript
<button className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded-lg transition-colors duration-200">
  Donate Now
</button>
```

### Custom Components

```typescript
// components/ui/Button.tsx
interface ButtonProps {
  variant?: 'primary' | 'secondary' | 'outline'
  size?: 'sm' | 'md' | 'lg'
  children: React.ReactNode
}

export function Button({ variant = 'primary', size = 'md', children }: ButtonProps) {
  const baseClasses = 'font-bold rounded-lg transition-colors'

  const variantClasses = {
    primary: 'bg-blue-600 hover:bg-blue-700 text-white',
    secondary: 'bg-gray-600 hover:bg-gray-700 text-white',
    outline: 'border-2 border-blue-600 text-blue-600 hover:bg-blue-50'
  }

  const sizeClasses = {
    sm: 'py-1 px-2 text-sm',
    md: 'py-2 px-4 text-base',
    lg: 'py-3 px-6 text-lg'
  }

  return (
    <button className={`${baseClasses} ${variantClasses[variant]} ${sizeClasses[size]}`}>
      {children}
    </button>
  )
}
```

### Responsive Design

```typescript
<div className="
  grid
  grid-cols-1
  md:grid-cols-2
  lg:grid-cols-3
  gap-4
  p-4
  sm:p-6
  lg:p-8
">
  {/* Mobile: 1 column, Tablet: 2 columns, Desktop: 3 columns */}
</div>
```

## Error Handling

### Error Boundaries

```typescript
// components/ErrorBoundary.tsx
'use client'

import React from 'react'

export class ErrorBoundary extends React.Component<
  { children: React.ReactNode },
  { hasError: boolean }
> {
  constructor(props: any) {
    super(props)
    this.state = { hasError: false }
  }

  static getDerivedStateFromError() {
    return { hasError: true }
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('Error boundary caught:', error, errorInfo)
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="p-8 text-center">
          <h2 className="text-2xl font-bold text-red-600">Something went wrong</h2>
          <button
            onClick={() => this.setState({ hasError: false })}
            className="mt-4 px-4 py-2 bg-blue-600 text-white rounded"
          >
            Try again
          </button>
        </div>
      )
    }

    return this.props.children
  }
}
```

### Try-Catch in Components

```typescript
'use client'

export function DonationForm() {
  const [error, setError] = useState<string | null>(null)

  const handleSubmit = async (data: FormData) => {
    try {
      setError(null)
      const result = await fetch('/api/donations', {
        method: 'POST',
        body: JSON.stringify(data)
      })

      if (!result.ok) {
        throw new Error('Failed to process donation')
      }

      // Success
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred')
    }
  }

  return (
    <form onSubmit={handleSubmit}>
      {error && (
        <div className="p-4 bg-red-50 text-red-600 rounded">
          {error}
        </div>
      )}
      {/* Form fields */}
    </form>
  )
}
```

## Performance Optimization

### 1. Code Splitting

Automatic with Next.js App Router:

```typescript
// Lazy load heavy components
import dynamic from 'next/dynamic'

const MapView = dynamic(() => import('@/components/MapView'), {
  ssr: false, // Don't render on server (uses browser APIs)
  loading: () => <MapSkeleton />
})
```

### 2. Image Optimization

```typescript
import Image from 'next/image'

<Image
  src={campaign.image_url}
  alt={campaign.title}
  width={800}
  height={600}
  className="rounded-lg"
  priority={false} // Lazy load by default
/>
```

### 3. Memoization

```typescript
import { useMemo } from 'react'

export function ExpensiveComponent({ data }) {
  const processedData = useMemo(() => {
    return data.map(item => /* expensive operation */)
  }, [data])

  return <Chart data={processedData} />
}
```

## Testing Patterns

### Component Testing

```typescript
// __tests__/components/Button.test.tsx
import { render, screen, fireEvent } from '@testing-library/react'
import { Button } from '@/components/ui/Button'

describe('Button', () => {
  it('renders children', () => {
    render(<Button>Click me</Button>)
    expect(screen.getByText('Click me')).toBeInTheDocument()
  })

  it('calls onClick when clicked', () => {
    const handleClick = jest.fn()
    render(<Button onClick={handleClick}>Click</Button>)
    fireEvent.click(screen.getByText('Click'))
    expect(handleClick).toHaveBeenCalledTimes(1)
  })
})
```

## Next Steps

- [Backend Architecture](./backend.md) - API routes and services
- [Database Design](./database.md) - Schema and relationships
- [API Documentation](../api/overview.md) - API reference

## Resources

- [Next.js App Router](https://nextjs.org/docs/app)
- [React Server Components](https://react.dev/blog/2023/03/22/react-labs-what-we-have-been-working-on-march-2023#react-server-components)
- [Tailwind CSS](https://tailwindcss.com/docs)
