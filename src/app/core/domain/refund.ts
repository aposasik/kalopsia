/** Ο κανόνας ακύρωσης ως δεδομένα: αλλάζει χωρίς να αγγίξεις τη συνάρτηση. */
export interface CancellationPolicy {
  fullRefundHours: number;     // από τόσες ώρες και πάνω: όλη η προκαταβολή πίσω
  partialRefundHours: number;  // από τόσες ώρες και πάνω: μερική επιστροφή
  keepFraction: number;        // τι μέρος κρατά το μαγαζί στη μερική (0.25 = 1/4)
  keepOf: 'deposit' | 'price'; // το 1/4 ποιου ποσού
}

export const KALOPSIA_POLICY: CancellationPolicy = {
  fullRefundHours: 48,
  partialRefundHours: 24,
  keepFraction: 0.25,
  keepOf: 'deposit',
};

/** Πόσα λεπτά επιστρέφονται στον πελάτη. Ποτέ κάτω από 0. */
export function refundFor(
  depositCents: number,
  priceCents: number,
  hoursBefore: number,
  policy: CancellationPolicy,
): number {
  if (hoursBefore >= policy.fullRefundHours) {
    return depositCents;
  }

  if (hoursBefore >= policy.partialRefundHours) {
    const base = policy.keepOf === 'deposit' ? depositCents : priceCents;
    return Math.max(0, depositCents - base * policy.keepFraction);
  }
  return 0;
}