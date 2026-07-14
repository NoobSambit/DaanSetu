# AI Recommendations and Moderation Helpers

DaanSetu uses AI as a helper, not as the final authority. Gemini can help with recommendations, chat, and content analysis, but the app must keep deterministic fallback behavior.

## Routes

- `/api/ai/recommend-ngos`
- `/api/ai/recommend-campaigns`
- `/api/ai/chat`
- `/api/ai/analyze-content`

## Main Files

- `lib/services/gemini.ts`
- `lib/domain/recommendations.ts`
- `lib/domain/campaigns.ts`
- `lib/services/ai-flags.ts`
- `app/dashboard/components/AIRecommendations.tsx`
- `app/campaigns/components/AICampaignSuggestions.tsx`
- `components/AskDaanSetuChatbot.tsx`

## Recommendation Features

The app can recommend:

- NGOs.
- Campaigns.
- Campaign suggestions.

Recommendations should be based on selected candidate data. The AI service should not receive unnecessary private data.

## Deterministic Fallback

If Gemini is unavailable, misconfigured, slow, or returns unusable output, the app should fall back to deterministic ranking. This keeps the product usable without AI.

## Content Analysis

`/api/ai/analyze-content` can support content checks and flagging. Flags should be reviewed by admins and stored in `ai_flags`.

## Chatbot

`AskDaanSetuChatbot` provides an assistant-style interface. It should help users understand the platform and find relevant actions, but it should not bypass normal permission checks.

## AI Safety Rules

- Do not let AI approve NGO verification.
- Do not let AI approve refunds, payouts, or financial reconciliation.
- Do not send secrets or sensitive documents to the model.
- Treat AI flags as review signals.
- Keep deterministic behavior available.

