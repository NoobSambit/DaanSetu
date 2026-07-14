export function paiseToSettlementMinor(
  amountPaise: number,
  inrPerSettlementUnit: number,
): number {
  if (!Number.isSafeInteger(amountPaise) || amountPaise <= 0) {
    throw new Error("Amount must be positive integer paise");
  }
  if (!Number.isFinite(inrPerSettlementUnit) || inrPerSettlementUnit <= 0) {
    throw new Error("Settlement rate must be positive");
  }
  return Math.max(1, Math.round(amountPaise / inrPerSettlementUnit));
}

export function settlementMinorToPaise(
  amountMinor: number,
  inrPerSettlementUnit: number,
): number {
  if (!Number.isSafeInteger(amountMinor) || amountMinor <= 0) {
    throw new Error("Settlement amount must be positive integer minor units");
  }
  if (!Number.isFinite(inrPerSettlementUnit) || inrPerSettlementUnit <= 0) {
    throw new Error("Settlement rate must be positive");
  }
  return Math.round(amountMinor * inrPerSettlementUnit);
}
