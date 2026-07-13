export type VolunteerMatchInput = {
  profile: {
    city: string;
    skills: readonly string[];
    availability: readonly string[];
  };
  opportunity: {
    city: string;
    requiredSkills: readonly string[];
    availability: readonly string[];
  };
};

function normalized(values: readonly string[]): Set<string> {
  return new Set(values.map((value) => value.trim().toLowerCase()));
}

export function scoreVolunteerOpportunity(input: VolunteerMatchInput): number {
  const skills = normalized(input.profile.skills);
  const requiredSkills = normalized(input.opportunity.requiredSkills);
  const availability = normalized(input.profile.availability);
  const requiredAvailability = normalized(input.opportunity.availability);

  const skillMatches = [...requiredSkills].filter((skill) =>
    skills.has(skill),
  ).length;
  const skillScore = requiredSkills.size
    ? (skillMatches / requiredSkills.size) * 60
    : 60;
  const locationScore =
    input.profile.city.trim().toLowerCase() ===
    input.opportunity.city.trim().toLowerCase()
      ? 25
      : 0;
  const availabilityScore = [...requiredAvailability].some((slot) =>
    availability.has(slot),
  )
    ? 15
    : requiredAvailability.size === 0
      ? 15
      : 0;

  return (
    Math.round((skillScore + locationScore + availabilityScore) * 100) / 100
  );
}
