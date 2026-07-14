# AI APIs

## `/api/ai/recommend-ngos`

Returns NGO recommendations.

Expected behavior:

- Use selected candidate data.
- Fall back to deterministic ranking when Gemini is unavailable.
- Avoid unnecessary private data.

## `/api/ai/recommend-campaigns`

Returns campaign recommendations using similar fallback rules.

## `/api/ai/chat`

Supports the DaanSetu chatbot experience.

## `/api/ai/analyze-content`

Analyzes content and can create review signals. AI analysis should not directly replace admin moderation.
