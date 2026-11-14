import { Interval, overlaps } from './interval';

export interface SlotQuery {
  open: Interval; // πότε δουλεύει ο κομμωτής εκείνη τη μέρα
  busy: Interval[]; // τα ραντεβού που έχει ήδη
  durationMin: number; // πόσο κρατά η υπηρεσία
  stepMin: number; // κάθε πόσα λεπτά προτείνουμε ώρα (30 = 10:00, 10:30, 11:00…)
}

/** Οι ώρες έναρξης όπου χωράει ολόκληρη η υπηρεσία, με χρονική σειρά. */
export function freeSlots(query: SlotQuery): Date[] {
  // TODO: προχώρα από το open.start ανά stepMin· κράτα όσα χωράνε και δεν πατάνε σε busy
  const { open, busy, durationMin, stepMin } = query;
  const freeSlots: Date[] = [];
  const totalMinutes = (open.end.getTime() - open.start.getTime()) / 60000;

  for (let i = 0; i <= totalMinutes; i += stepMin) {
    const slotStart = new Date(open.start.getTime() + i * 60000);
    const slotEnd = new Date(slotStart.getTime() + durationMin * 60000);

    if (slotEnd <= open.end && !busy.some((b) => overlaps({ start: slotStart, end: slotEnd }, b))) {
      freeSlots.push(slotStart);
    }
  }
  return freeSlots;
}
