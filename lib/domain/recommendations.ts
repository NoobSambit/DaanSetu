export type RecommendationCandidate = {
  id: string;
  category?: string | null;
  skills?: readonly string[];
  city?: string | null;
  state?: string | null;
  followed?: boolean;
  priorDonation?: boolean;
  recentActivity?: boolean;
};

export type RecommendationProfile = {
  categories: readonly string[];
  skills: readonly string[];
  city?: string | null;
  state?: string | null;
};

const normalize = (value: string) => value.trim().toLowerCase();

export function scoreRecommendation(
  candidate: RecommendationCandidate,
  profile: RecommendationProfile,
): number {
  const categories = new Set(profile.categories.map(normalize));
  const skills = new Set(profile.skills.map(normalize));
  const categoryScore =
    candidate.category && categories.has(normalize(candidate.category))
      ? 30
      : 0;
  const skillScore = Math.min(
    25,
    (candidate.skills ?? []).filter((skill) => skills.has(normalize(skill)))
      .length * 10,
  );
  const locationScore =
    candidate.city &&
    profile.city &&
    normalize(candidate.city) === normalize(profile.city)
      ? 20
      : candidate.state &&
          profile.state &&
          normalize(candidate.state) === normalize(profile.state)
        ? 10
        : 0;
  const followScore = candidate.followed ? 10 : 0;
  const donationScore = candidate.priorDonation ? 10 : 0;
  const activityScore = candidate.recentActivity ? 5 : 0;
  return (
    categoryScore +
    skillScore +
    locationScore +
    followScore +
    donationScore +
    activityScore
  );
}

export function rankRecommendations<T extends RecommendationCandidate>(
  candidates: readonly T[],
  profile: RecommendationProfile,
): Array<T & { score: number }> {
  return candidates
    .map((candidate) => ({
      ...candidate,
      score: scoreRecommendation(candidate, profile),
    }))
    .sort(
      (left, right) =>
        right.score - left.score || left.id.localeCompare(right.id),
    );
}
