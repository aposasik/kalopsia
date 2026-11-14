import { Interval } from './interval';
import { freeSlots } from './slots';

const at = (hhmm: string) => new Date('2026-11-12T' + hhmm + ':00Z');
const iv = (from: string, to: string): Interval => ({
  start: at(from),
  end: at(to),
});

describe('freeSlots', () => {
  it('an empty morning 10:00-12:00, 60 minutes, every 30: three starts', () => {
    const slots = freeSlots({
      open: iv('10:00', '12:00'),
      busy: [],
      durationMin: 60,
      stepMin: 30,
    });
    expect(slots).toEqual([at('10:00'), at('10:30'), at('11:00')]);
  });

  it('a booking 10:30-11:00 leaves only 11:00', () => {
    const slots = freeSlots({
      open: iv('10:00', '12:00'),
      busy: [iv('10:30', '11:00')],
      durationMin: 60,
      stepMin: 30,
    });
    expect(slots).toEqual([at('11:00')]);
  });

  it('a slot that ends exactly at closing time is allowed', () => {
    const slots = freeSlots({
      open: iv('10:00', '11:00'),
      busy: [],
      durationMin: 60,
      stepMin: 30,
    });
    expect(slots).toEqual([at('10:00')]);
  });

  it('a service longer than the opening hours gives no slots', () => {
    const slots = freeSlots({
      open: iv('10:00', '10:30'),
      busy: [],
      durationMin: 60,
      stepMin: 30,
    });
    expect(slots).toEqual([]);
  });

  it('a booking outside the opening hours changes nothing', () => {
    const slots = freeSlots({
      open: iv('10:00', '12:00'),
      busy: [iv('09:00', '10:00')],
      durationMin: 60,
      stepMin: 30,
    });
    expect(slots).toEqual([at('10:00'), at('10:30'), at('11:00')]);
  });

  it('a fully booked day gives no slots', () => {
    const slots = freeSlots({
      open: iv('10:00', '12:00'),
      busy: [iv('10:00', '12:00')],
      durationMin: 60,
      stepMin: 30,
    });
    expect(slots).toEqual([]);
  });

  // it('throws a RangeError when stepMin is 0 or negative', () => {
  //   expect(() =>
  //     freeSlots({
  //       open: iv('10:00', '12:00'),
  //       busy: [],
  //       durationMin: 60,
  //       stepMin: 0,
  //     }),
  //   ).toThrow(RangeError);
  // });
});
