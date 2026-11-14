/**
 * Οι στιγμές που πρέπει να φύγει υπενθύμιση, με χρονική σειρά.
 * Όσες έχουν ήδη περάσει (πριν το now) δεν επιστρέφονται.
 */
export function reminderTimes(start: Date, now: Date, hoursBefore: number[] = [48, 24]): Date[] {
  // TODO
  const times: Date[] = [];
/**
 *   it('custom hours [72, 2] give reminders 72h and 2h before', () => {
     const times = reminderTimes(
       at('2026-11-12T10:00:00Z'),
       at('2026-11-05T10:00:00Z'),
       [72, 2],
     );
     expect(times).toEqual([at('2026-11-09T10:00:00Z'), at('2026-11-11T12:00:00Z')]);
   });  
 */
  for (const hours of hoursBefore) {
    const time = new Date(start.getTime() - hours * 60 * 60 * 1000);
    if (time > now) {
      times.push(time);
    }
  }
  return times;
}
