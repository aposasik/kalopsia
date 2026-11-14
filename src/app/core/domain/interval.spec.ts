import { Interval, overlaps } from './interval';

const iv = (from: string, to: string): Interval => ({
  start: new Date('2026-11-12T' + from + ':00Z'),
  end: new Date('2026-11-12T' + to + ':00Z'),
});

describe('overlaps', () => {
  it('back-to-back appointments do not overlap', () => {
    expect(overlaps(iv('10:00', '11:00'), iv('11:00', '12:00'))).toBe(false);
  });

  it('the same interval overlaps itself', () => {
    expect(overlaps(iv('10:00', '11:00'), iv('10:00', '11:00'))).toBe(true);
  });

  it('a partial overlap (10:00-11:00 and 10:30-11:30) is an overlap', () => {
    expect(overlaps(iv('10:00', '11:00'), iv('10:30', '11:30'))).toBe(true);
  });

  it('one inside the other is an overlap', () => {
    expect(overlaps(iv('10:00', '12:00'), iv('11:00', '11:30'))).toBe(true);
  });

  it('far apart is not an overlap', () => {
    expect(overlaps(iv('10:00', '11:00'), iv('12:00', '13:00'))).toBe(false);
  });

  it('the order of the two arguments does not matter', () => {
    expect(overlaps(iv('10:00', '11:00'), iv('10:30', '11:30'))).toBe(true);
    expect(overlaps(iv('10:30', '11:30'), iv('10:00', '11:00'))).toBe(true);
  });
  
});