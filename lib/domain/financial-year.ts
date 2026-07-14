const financialYearPattern = /^(\d{4})-(\d{2})$/;

export function financialYearForDate(date: Date): string {
  if (Number.isNaN(date.getTime())) throw new Error("Invalid date");
  const year = date.getUTCFullYear();
  const startsIn = date.getUTCMonth() >= 3 ? year : year - 1;
  return `${startsIn}-${String((startsIn + 1) % 100).padStart(2, "0")}`;
}

export function financialYearRange(financialYear: string) {
  const match = financialYearPattern.exec(financialYear);
  if (!match) throw new Error("Invalid financial year");
  const startsIn = Number(match[1]);
  const expectedSuffix = String((startsIn + 1) % 100).padStart(2, "0");
  if (match[2] !== expectedSuffix) throw new Error("Invalid financial year");

  return {
    startsAt: new Date(Date.UTC(startsIn, 3, 1)).toISOString(),
    endsBefore: new Date(Date.UTC(startsIn + 1, 3, 1)).toISOString(),
  };
}
