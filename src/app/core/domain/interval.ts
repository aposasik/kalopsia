/** Χρονικό διάστημα [start, end): η αρχή μέσα, το τέλος έξω. */
export interface Interval {
  start: Date;
  end: Date;
}

/** true αν τα δύο διαστήματα έχουν έστω μία κοινή στιγμή. */
export function overlaps(a: Interval, b: Interval): boolean {
  return (a.start < b.end && b.start < a.end);
}