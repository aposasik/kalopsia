import { reminderTimes } from './reminders';

const at = (iso: string) => new Date(iso);

describe('reminderTimes', () => {
  it('booked a week ahead: one reminder 48h before and one 24h before', () => {
    const times = reminderTimes(
      at('2026-11-12T10:00:00Z'),
      at('2026-11-05T10:00:00Z'),
    );
    expect(times).toEqual([at('2026-11-10T10:00:00Z'), at('2026-11-11T10:00:00Z')]);
  });

  it('booked 30 hours ahead: only the 24h reminder', () => {
    const times = reminderTimes(
      at('2026-11-12T10:00:00Z'),
      at('2026-11-11T04:00:00Z'),
    );
    expect(times).toEqual([at('2026-11-11T10:00:00Z')]);
  });

  it('booked 10 hours ahead: no reminders', () => {
    const times = reminderTimes(
      at('2026-11-12T10:00:00Z'),
      at('2026-11-11T22:00:00Z'),
    );
    expect(times).toEqual([]);
  });

  it('custom hours [72, 2] give reminders 72h and 2h before', () => {
    const times = reminderTimes(
      at('2026-11-12T10:00:00Z'),
      at('2026-11-05T10:00:00Z'),
      [72, 2],
    );
    expect(times).toEqual([at('2026-11-09T10:00:00Z'), at('2026-11-12T08:00:00Z')]);
  });
  
});