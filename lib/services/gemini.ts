import { GoogleGenerativeAI } from '@google/generative-ai'

// Initialize Gemini AI client
// SECURITY: Using server-side only environment variable (not NEXT_PUBLIC_)
const getGeminiClient = () => {
  const apiKey = process.env.GEMINI_API_KEY
  if (!apiKey) {
    throw new Error(
      'GEMINI_API_KEY is not configured. ' +
      'Please add GEMINI_API_KEY to your .env file (server-side only, not NEXT_PUBLIC_)'
    )
  }
  return new GoogleGenerativeAI(apiKey)
}

// Cache for AI responses to reduce API costs
const aiCache = new Map<string, { data: any; timestamp: number }>()
const CACHE_TTL = 1000 * 60 * 60 // 1 hour

function getCachedResponse<T>(key: string): T | null {
  const cached = aiCache.get(key)
  if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
    return cached.data as T
  }
  return null
}

function setCachedResponse(key: string, data: any): void {
  aiCache.set(key, { data, timestamp: Date.now() })
  // Clean up old cache entries if cache gets too large
  if (aiCache.size > 1000) {
    const entriesToDelete = Array.from(aiCache.entries())
      .sort((a, b) => a[1].timestamp - b[1].timestamp)
      .slice(0, 500)
    entriesToDelete.forEach(([k]) => aiCache.delete(k))
  }
}

/**
 * Generate AI recommendations for NGOs based on user preferences
 */
export async function generateNGORecommendations(userContext: {
  donationCauses: string[]
  browsedCategories: string[]
  volunteerSkills: string[]
  ngoList: Array<{ id: string; name: string; category: string; description: string }>
}) {
  try {
    // Create cache key from user context
    const cacheKey = `ngo_rec_${JSON.stringify({
      causes: userContext.donationCauses.sort(),
      categories: userContext.browsedCategories.sort(),
      skills: userContext.volunteerSkills.sort(),
    })}`

    // Check cache first
    const cached = getCachedResponse<Array<{ ngo_name: string; reason: string }>>(cacheKey)
    if (cached) {
      return cached
    }

    const genAI = getGeminiClient()
    const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' })

    const prompt = `Based on the following user interests and available NGOs, suggest the top 3 most relevant NGOs and explain why they would be a good match.

User Interests:
- Donation causes: ${userContext.donationCauses.join(', ') || 'None yet'}
- Browsed categories: ${userContext.browsedCategories.join(', ') || 'None yet'}
- Volunteer skills: ${userContext.volunteerSkills.join(', ') || 'None yet'}

Available NGOs:
${userContext.ngoList.map(ngo => `- ${ngo.name} (${ngo.category}): ${ngo.description.substring(0, 100)}...`).join('\n')}

Please respond in JSON format with an array of exactly 3 recommendations:
[
  {
    "ngo_name": "NGO Name (must match exactly from the list above)",
    "reason": "Brief reason in 1-2 sentences why this NGO matches user interests"
  }
]

Only recommend NGOs from the provided list. If user has no interests yet, recommend diverse popular NGOs.`

    const result = await model.generateContent(prompt)
    const response = result.response.text()

    // Extract JSON from response
    const jsonMatch = response.match(/\[[\s\S]*\]/)
    if (jsonMatch) {
      try {
        const recommendations = JSON.parse(jsonMatch[0])

        // Validate response structure
        if (!Array.isArray(recommendations)) {
          console.error('AI response is not an array')
          return []
        }

        // Sanitize and validate each recommendation
        const validatedRecs = recommendations
          .filter((rec: any) => rec && typeof rec === 'object')
          .filter((rec: any) => typeof rec.ngo_name === 'string' && typeof rec.reason === 'string')
          .map((rec: any) => ({
            ngo_name: rec.ngo_name.substring(0, 200), // Limit length
            reason: rec.reason.substring(0, 500) // Limit length
          }))
          .slice(0, 10) // Max 10 recommendations

        // Cache the result
        setCachedResponse(cacheKey, validatedRecs)
        return validatedRecs as Array<{ ngo_name: string; reason: string }>
      } catch (parseError) {
        console.error('Failed to parse AI response:', parseError)
        return []
      }
    }

    return []
  } catch (error) {
    console.error('Error generating NGO recommendations:', error)
    return []
  }
}

/**
 * Generate AI recommendations for campaigns based on user preferences
 */
export async function generateCampaignRecommendations(userContext: {
  donationCauses: string[]
  browsedCategories: string[]
  campaigns: Array<{ id: string; title: string; category: string; short_description: string }>
}) {
  try {
    // Create cache key from user context
    const cacheKey = `campaign_rec_${JSON.stringify({
      causes: userContext.donationCauses.sort(),
      categories: userContext.browsedCategories.sort(),
    })}`

    // Check cache first
    const cached = getCachedResponse<Array<{ campaign_title: string; reason: string }>>(cacheKey)
    if (cached) {
      return cached
    }

    const genAI = getGeminiClient()
    const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' })

    const prompt = `Based on the following user interests and available campaigns, suggest the top 3 most relevant campaigns and explain why.

User Interests:
- Donation causes: ${userContext.donationCauses.join(', ') || 'None yet'}
- Browsed categories: ${userContext.browsedCategories.join(', ') || 'None yet'}

Available Campaigns:
${userContext.campaigns.map(c => `- ${c.title} (${c.category}): ${c.short_description}`).join('\n')}

Please respond in JSON format with an array of exactly 3 recommendations:
[
  {
    "campaign_title": "Campaign Title (must match exactly from the list above)",
    "reason": "Brief reason in 1-2 sentences"
  }
]

Only recommend campaigns from the provided list. If user has no interests, recommend diverse urgent campaigns.`

    const result = await model.generateContent(prompt)
    const response = result.response.text()

    // Extract JSON from response
    const jsonMatch = response.match(/\[[\s\S]*\]/)
    if (jsonMatch) {
      const recommendations = JSON.parse(jsonMatch[0])
      // Cache the result
      setCachedResponse(cacheKey, recommendations)
      return recommendations as Array<{ campaign_title: string; reason: string }>
    }

    return []
  } catch (error) {
    console.error('Error generating campaign recommendations:', error)
    return []
  }
}

/**
 * Chat with DaanSetu AI assistant
 * Note: Chat responses are not cached as they are user-specific and contextual
 */
export async function chatWithDaanSetu(
  userMessage: string,
  context: {
    ngos: Array<{ name: string; category: string; city: string; description: string }>
    campaigns: Array<{ title: string; category: string; goal_amount: number }>
  }
) {
  try {
    const genAI = getGeminiClient()
    const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' })

    const prompt = `You are DaanSetu, a friendly AI assistant helping users find the best NGOs and donation opportunities in India.

Available NGOs:
${context.ngos.slice(0, 20).map(ngo => `- ${ngo.name} in ${ngo.city} (${ngo.category}): ${ngo.description.substring(0, 80)}...`).join('\n')}

Available Campaigns:
${context.campaigns.slice(0, 10).map(c => `- ${c.title} (${c.category}) - Goal: ₹${c.goal_amount}`).join('\n')}

User Question: ${userMessage}

Instructions:
- Answer in 2-3 short, friendly sentences
- Suggest ONLY real NGOs or campaigns from the lists above (never make up names)
- If asking about a specific cause/location, mention relevant NGOs by name
- Be helpful and warm in tone
- Keep responses concise and actionable

Response:`

    const result = await model.generateContent(prompt)
    const response = result.response.text()

    return response.trim()
  } catch (error) {
    console.error('Error in DaanSetu chat:', error)
    return 'Sorry, I encountered an error. Please try again!'
  }
}

/**
 * Analyze content for quality and potential fraud flags
 */
export async function analyzeContentQuality(
  entityType: 'ngo' | 'campaign',
  content: {
    title: string
    description: string
  }
) {
  try {
    const genAI = getGeminiClient()
    const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' })

    const prompt = `Analyze the following ${entityType} content for quality and potential red flags:

Title: ${content.title}
Description: ${content.description}

Check for:
- Vague or unclear descriptions
- Unrealistic promises or claims
- Poor grammar or unprofessional language
- Missing crucial information
- Potential scam indicators

Respond in JSON format:
{
  "is_suspicious": true or false,
  "confidence": "low" | "medium" | "high",
  "reason": "Brief explanation if suspicious, empty string if not"
}

Be conservative - only flag clear issues.`

    const result = await model.generateContent(prompt)
    const response = result.response.text()

    // Extract JSON from response
    const jsonMatch = response.match(/\{[\s\S]*\}/)
    if (jsonMatch) {
      const analysis = JSON.parse(jsonMatch[0])
      return analysis as { is_suspicious: boolean; confidence: string; reason: string }
    }

    return { is_suspicious: false, confidence: 'low', reason: '' }
  } catch (error) {
    console.error('Error analyzing content quality:', error)
    return { is_suspicious: false, confidence: 'low', reason: '' }
  }
}
