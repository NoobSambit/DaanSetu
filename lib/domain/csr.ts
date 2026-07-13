export function calculateCsrMatch(input: {
  donationPaise: number;
  matchPercent: number;
  employeeRemainingCapPaise: number | null;
  initiativeRemainingCapPaise: number | null;
}): number {
  const uncapped = Math.floor((input.donationPaise * input.matchPercent) / 100);
  return Math.max(
    0,
    Math.min(
      uncapped,
      input.employeeRemainingCapPaise ?? uncapped,
      input.initiativeRemainingCapPaise ?? uncapped,
    ),
  );
}
