import assert from "node:assert/strict";
import test from "node:test";

import { calculateCsrMatch } from "../../lib/domain/csr.ts";

test("calculates percentage matching in integer paise", () => {
  assert.equal(
    calculateCsrMatch({
      donationPaise: 10_001,
      matchPercent: 50,
      employeeRemainingCapPaise: null,
      initiativeRemainingCapPaise: null,
    }),
    5_000,
  );
});

test("applies both employee and initiative remaining caps", () => {
  assert.equal(
    calculateCsrMatch({
      donationPaise: 50_000,
      matchPercent: 200,
      employeeRemainingCapPaise: 40_000,
      initiativeRemainingCapPaise: 30_000,
    }),
    30_000,
  );
});
