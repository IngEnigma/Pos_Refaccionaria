/** Tope de DecimalField(10, 2) del backend. */
export const MAX_BRANCH_PRICE = 99999999.99;

/** H-14: número finito > 0, máximo 2 decimales y no mayor al tope del backend. */
export function isValidBranchPrice(value: unknown): value is number {
  if (typeof value !== 'number' || !Number.isFinite(value)) return false;
  const cents = value * 100;
  return value > 0 && value <= MAX_BRANCH_PRICE && Math.abs(cents - Math.round(cents)) < 1e-6;
}
