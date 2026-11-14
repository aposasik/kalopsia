/** Πόσες ώρες απέχει το ραντεβού από το «τώρα». Αρνητικό αν έχει ήδη αρχίσει. */
export function hoursBefore(start: Date, now: Date): number {
  const diffInMs = start.getTime() - now.getTime();
  return diffInMs / (1000 * 60 * 60);
}