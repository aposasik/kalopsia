import { hoursBefore } from './time';

const at = (iso: string) => new Date(iso);

describe('hoursBefore', () => {
  it('two days ahead is 48 hours', () => {
    expect(hoursBefore(at('2026-11-12T10:00:00Z'), at('2026-11-10T10:00:00Z'))).toBe(48);
  });

  it('30 minutes ahead is 0.5', () => {
    expect(hoursBefore(at('2026-11-12T10:30:00Z'), at('2026-11-12T10:00:00Z'))).toBe(0.5);
  });

  it('an appointment that already started gives a negative number', () => {
    expect(hoursBefore(at('2026-11-12T10:00:00Z'), at('2026-11-12T10:30:00Z'))).toBe(-0.5);
  });

  it('the same moment is 0', () => {
    expect(hoursBefore(at('2026-11-12T10:00:00Z'), at('2026-11-12T10:00:00Z'))).toBe(0);
  });
});