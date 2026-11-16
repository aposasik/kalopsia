/**
 * Οι στιγμές που πρέπει να φύγει υπενθύμιση, με χρονική σειρά.
 * Όσες έχουν ήδη περάσει (πριν το now) δεν επιστρέφονται.
 */
export function reminderTimes(start: Date, now: Date, hoursBefore: number[] = [48, 24]): Date[] {
  const times: Date[] = [];

  for (const hours of hoursBefore) {
    const time = new Date(start.getTime() - hours * 60 * 60 * 1000);
    if (time > now) {
      times.push(time);
    }
  }
  return times;
}
