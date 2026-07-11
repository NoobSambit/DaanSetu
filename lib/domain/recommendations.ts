export type RecommendationCandidate = { id: string; categories: string[]; skills: string[]; state: string | null; followed: boolean; donatedBefore: boolean; recentScore: number }
export type RecommendationProfile = { categories: string[]; skills: string[]; state: string | null }

export function rankRecommendations(candidates: RecommendationCandidate[], profile: RecommendationProfile) {
  const score = (item: RecommendationCandidate) =>
    item.categories.filter((value) => profile.categories.includes(value)).length * 30 +
    item.skills.filter((value) => profile.skills.includes(value)).length * 25 +
    (item.state && item.state === profile.state ? 15 : 0) +
    (item.followed ? 20 : 0) + (item.donatedBefore ? 20 : 0) + Math.max(0, Math.min(10, item.recentScore))
  return candidates.map((item) => ({ ...item, score: score(item) })).sort((a, b) => b.score - a.score || a.id.localeCompare(b.id))
}
