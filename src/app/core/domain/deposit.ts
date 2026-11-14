/**
 * Η προκαταβολή, σε λεπτά.
 * priceCents: η τιμή σε λεπτά (€40 = 4000) · rate: από 0 έως 1 (0.3 = 30%).
 */
export function depositFor(priceCents: number, rate: number): number {
  // TODO: έλεγξε το rate, υπολόγισε, στρογγύλεψε σε ακέραιο λεπτό
  if (rate < 0 || rate > 1) {
    throw new RangeError('Rate must be between 0 and 1');
  }
  const deposit = priceCents * rate;
  return Math.round(deposit);
}