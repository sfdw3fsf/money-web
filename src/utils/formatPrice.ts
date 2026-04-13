/**
 * Format a price with appropriate decimal places based on its value.
 * - >= $100 → 2 decimals (e.g. $83412.50)
 * - >= $1   → 3 decimals (e.g. $1.390)
 * - < $1    → 4 decimals (e.g. $0.1234)
 */
export function fmtPrice(price: number): string {
  if (price >= 100) return price.toFixed(2);
  if (price >= 1) return price.toFixed(3);
  return price.toFixed(4);
}
