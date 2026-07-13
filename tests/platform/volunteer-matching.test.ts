import assert from "node:assert/strict";
import test from "node:test";

import { scoreVolunteerOpportunity } from "../../lib/domain/volunteer-matching.ts";

test("scores skills, city, and availability deterministically", () => {
  const score = scoreVolunteerOpportunity({
    profile: {
      city: "Bengaluru",
      skills: ["Teaching", "Design"],
      availability: ["Weekends"],
    },
    opportunity: {
      city: "bengaluru",
      requiredSkills: ["teaching", "fundraising"],
      availability: ["weekends"],
    },
  });
  assert.equal(score, 70);
});

test("does not invent a location or availability match", () => {
  const score = scoreVolunteerOpportunity({
    profile: { city: "Pune", skills: [], availability: ["Evenings"] },
    opportunity: {
      city: "Delhi",
      requiredSkills: ["Legal"],
      availability: ["Weekdays"],
    },
  });
  assert.equal(score, 0);
});
