import assert from "node:assert/strict";
import test from "node:test";

import { rankRecommendations } from "../../lib/domain/recommendations.ts";

test("ranks only supplied candidates using deterministic user signals", () => {
  const candidates = [
    { id: "b", category: "health", city: "Delhi" },
    { id: "a", category: "education", city: "Pune", followed: true },
  ];
  const ranked = rankRecommendations(candidates, {
    categories: ["education"],
    skills: [],
    city: "Pune",
  });
  assert.deepEqual(
    ranked.map((candidate) => candidate.id),
    ["a", "b"],
  );
  assert.equal(ranked.length, candidates.length);
});

test("uses stable id ordering when scores tie", () => {
  const ranked = rankRecommendations([{ id: "z" }, { id: "a" }], {
    categories: [],
    skills: [],
  });
  assert.deepEqual(
    ranked.map((candidate) => candidate.id),
    ["a", "z"],
  );
});
