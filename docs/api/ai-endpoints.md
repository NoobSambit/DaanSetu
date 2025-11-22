# AI Endpoints

DaanSetu uses Google Gemini AI for personalized recommendations and content analysis.

## Overview

All AI endpoints are rate-limited to **10 requests per minute** per user/IP.

**Base Path**: `/api/ai/`

**Authentication**: Required for all endpoints

## Recommend NGOs

Get AI-powered NGO recommendations based on user interests.

### Endpoint
```
GET /api/ai/recommend-ngos
```

### Authentication
Required

### Response Caching
Cached for 1 hour based on user context

### Example Request

```bash
curl http://localhost:3000/api/ai/recommend-ngos \
  -H "Cookie: auth-token=..."
```

### Example Response

```json
{
  "recommendations": [
    {
      "ngo_name": "Education for All",
      "reason": "Based on your previous donations to education causes and your interest in child development, this NGO aligns perfectly with your values."
    },
    {
      "ngo_name": "Food Bank India",
      "reason": "You've shown interest in fighting hunger, and this organization has a strong track record in food distribution."
    },
    {
      "ngo_name": "Women Empowerment Trust",
      "reason": "Your volunteer skills in teaching and mentoring make you a great match for this women's empowerment initiative."
    }
  ]
}
```

### How It Works

1. Fetches user's donation history, browsed categories, volunteer skills
2. Gets list of all NGOs from database
3. Sends context to Gemini AI with prompt
4. AI analyzes and returns top 3 matches with explanations
5. Response cached for 1 hour

### Error Responses

**401 Unauthorized**:
```json
{
  "error": "Unauthorized",
  "message": "Authentication required"
}
```

**429 Too Many Requests**:
```json
{
  "error": "Too many requests",
  "message": "Rate limit exceeded. Please try again later.",
  "resetAt": "2024-01-01T00:01:00.000Z"
}
```

## Recommend Campaigns

Get AI-powered campaign recommendations.

### Endpoint
```
POST /api/ai/recommend-campaigns
```

### Authentication
Required

### Request Body
```typescript
{
  userContext?: {
    donationCauses?: string[]
    browsedCategories?: string[]
  }
}
```

### Example Request

```bash
curl -X POST http://localhost:3000/api/ai/recommend-campaigns \
  -H "Content-Type: application/json" \
  -H "Cookie: auth-token=..." \
  -d '{
    "userContext": {
      "donationCauses": ["education", "health"],
      "browsedCategories": ["education"]
    }
  }'
```

### Example Response

```json
{
  "recommendations": [
    {
      "campaign_title": "Build a School in Rural Bihar",
      "reason": "This education-focused campaign matches your interest in education and rural development."
    },
    {
      "campaign_title": "Medical Equipment for Village Clinics",
      "reason": "Your healthcare donations suggest you'd want to support this vital medical infrastructure project."
    }
  ]
}
```

## Chat with AI Assistant

Chat with DaanSetu AI assistant for guidance.

### Endpoint
```
POST /api/ai/chat
```

### Authentication
Required

### Request Body
```typescript
{
  message: string  // User's question (max 500 characters)
}
```

### Example Request

```bash
curl -X POST http://localhost:3000/api/ai/chat \
  -H "Content-Type: application/json" \
  -H "Cookie: auth-token=..." \
  -d '{
    "message": "Which NGOs work on education in Mumbai?"
  }'
```

### Example Response

```json
{
  "response": "I'd recommend checking out 'Education for All' in Mumbai, which provides free education to underprivileged children. They have a strong presence in urban slums. Another great option is 'Teach India Foundation' which focuses on teacher training and school infrastructure."
}
```

### Chat Capabilities

The AI assistant can:
- Recommend NGOs based on location/cause
- Suggest campaigns matching user interests
- Answer questions about how to donate or volunteer
- Provide information about available opportunities

### Chat Limitations

- Responses limited to 2-3 sentences for conciseness
- Only suggests real NGOs/campaigns from database (no hallucinations)
- Cann't process payments or create accounts

## Analyze Content

Analyze NGO/campaign content for quality and potential fraud.

### Endpoint
```
POST /api/ai/analyze-content
```

### Authentication
Required (typically admin only)

### Request Body
```typescript
{
  entityType: 'ngo' | 'campaign'
  content: {
    title: string
    description: string
  }
}
```

### Example Request

```bash
curl -X POST http://localhost:3000/api/ai/analyze-content \
  -H "Content-Type: application/json" \
  -H "Cookie: auth-token=..." \
  -d '{
    "entityType": "campaign",
    "content": {
      "title": "Help Us!!!",
      "description": "We need money urgently. Donate now to get 100x blessings!"
    }
  }'
```

### Example Response

```json
{
  "is_suspicious": true,
  "confidence": "high",
  "reason": "Vague description, excessive urgency, unrealistic promises (100x blessings), poor professionalism"
}
```

### Analysis Criteria

The AI checks for:
- **Vague descriptions**: Lack of specific details
- **Unrealistic promises**: Too-good-to-be-true claims
- **Poor grammar**: Unprofessional language
- **Missing information**: Lack of goals, timelines, plans
- **Scam indicators**: Urgency, guaranteed returns, emotional manipulation

### Use Cases

- Pre-approval screening for new campaigns
- Flagging suspicious content for review
- Quality assurance for NGO descriptions
- Admin moderation tool

## AI Configuration

### Model Selection

DaanSetu uses **gemini-1.5-flash** for optimal performance:

```typescript
// lib/services/gemini.ts
const model = genAI.getGenerativeModel({
  model: 'gemini-1.5-flash'
})
```

**Why gemini-1.5-flash?**
- Fast response times (< 2 seconds)
- Good quality for recommendation tasks
- Cost-effective for high volume
- 1M token context window

### Caching Strategy

```typescript
// Cache AI responses for 1 hour
const CACHE_TTL = 1000 * 60 * 60  // 1 hour

// Cache key based on user context
const cacheKey = `ngo_rec_${JSON.stringify(userContext)}`

// Check cache first
const cached = getCachedResponse(cacheKey)
if (cached) return cached

// Generate and cache
const response = await generateRecommendations(...)
setCachedResponse(cacheKey, response)
```

**Benefits**:
- Reduces API costs (same context = cached response)
- Faster responses for repeated queries
- Automatic cache cleanup (LRU eviction)

### Prompt Engineering

Prompts are carefully crafted for accuracy:

```typescript
const prompt = `Based on the following user interests and available NGOs,
suggest the top 3 most relevant NGOs and explain why they would be a good match.

User Interests:
- Donation causes: ${donationCauses.join(', ')}
- Browsed categories: ${browsedCategories.join(', ')}
- Volunteer skills: ${volunteerSkills.join(', ')}

Available NGOs:
${ngoList.map(ngo => `- ${ngo.name} (${ngo.category}): ${ngo.description}`).join('\n')}

Please respond in JSON format with an array of exactly 3 recommendations:
[
  {
    "ngo_name": "NGO Name (must match exactly from the list above)",
    "reason": "Brief reason in 1-2 sentences why this NGO matches user interests"
  }
]

Only recommend NGOs from the provided list. If user has no interests yet,
recommend diverse popular NGOs.`
```

## Rate Limiting

AI endpoints are strictly rate-limited due to API costs:

```typescript
// lib/middleware/rate-limit.ts
export const RATE_LIMITS = {
  AI: {
    windowMs: 60 * 1000,  // 1 minute
    maxRequests: 10        // 10 requests per minute
  }
}
```

### Rate Limit Headers

```
X-RateLimit-Limit: 10
X-RateLimit-Remaining: 7
X-RateLimit-Reset: 1640000000
```

## Error Handling

### Input Validation

```typescript
// Validate message length
if (!message || message.length > 500) {
  return NextResponse.json(
    { error: 'Message must be between 1-500 characters' },
    { status: 400 }
  )
}
```

### AI Service Errors

```typescript
try {
  const recommendations = await generateNGORecommendations(...)
} catch (error) {
  console.error('AI service error:', error)
  return NextResponse.json(
    {
      error: 'AI service unavailable',
      message: 'Failed to generate recommendations. Please try again.'
    },
    { status: 500 }
  )
}
```

### Fallback Responses

If AI fails, return empty array instead of error:

```typescript
try {
  return await generateRecommendations(...)
} catch (error) {
  console.error('AI error:', error)
  return [] // Graceful degradation
}
```

## Security Considerations

### API Key Protection

```typescript
// ✅ Correct: Server-side only
const apiKey = process.env.GEMINI_API_KEY

// ❌ Wrong: Would expose key to client
const apiKey = process.env.NEXT_PUBLIC_GEMINI_API_KEY
```

### Content Sanitization

AI responses are sanitized before returning:

```typescript
const validatedRecs = recommendations
  .filter(rec => typeof rec.ngo_name === 'string')
  .map(rec => ({
    ngo_name: rec.ngo_name.substring(0, 200),  // Limit length
    reason: rec.reason.substring(0, 500)       // Limit length
  }))
  .slice(0, 10)  // Max 10 recommendations
```

## Cost Optimization

### Strategies

1. **Caching**: 1-hour TTL reduces repeat calls
2. **Rate limiting**: Prevents abuse
3. **Efficient prompts**: Shorter prompts = lower costs
4. **Flash model**: More cost-effective than Pro
5. **Lazy loading**: Only call AI when user requests

### Monitoring

Track AI usage in logs:

```typescript
console.log('AI call:', {
  endpoint: '/api/ai/recommend-ngos',
  userId: user.id,
  cached: !!cached,
  timestamp: new Date()
})
```

## Next Steps

- [Payment API](./payment.md) - Payment processing
- [Social API](./social.md) - Social features
- [AI Features Guide](../features/ai-features.md) - Detailed AI implementation

## Resources

- [Google Gemini AI Documentation](https://ai.google.dev/docs)
- [Gemini API Pricing](https://ai.google.dev/pricing)
