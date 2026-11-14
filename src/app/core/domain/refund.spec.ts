import { KALOPSIA_POLICY, refundFor } from './refund';

describe('refundFor', () => {
  it('72 hours before: the whole deposit comes back', () => {
    expect(refundFor(1200, 4000, 72, KALOPSIA_POLICY)).toBe(1200);
  });

  it('exactly 48 hours before: still the whole deposit', () => {
    expect(refundFor(1200, 4000, 48, KALOPSIA_POLICY)).toBe(1200);
  });

  it('47 hours before: the deposit minus a quarter of it (900)', () => {
    expect(refundFor(1200, 4000, 47, KALOPSIA_POLICY)).toBe(900);
  });

  it('exactly 24 hours before: still the partial tier (900)', () => {
    expect(refundFor(1200, 4000, 24, KALOPSIA_POLICY)).toBe(900);
  });

  it('23 hours before: nothing', () => {
    expect(refundFor(1200, 4000, 23, KALOPSIA_POLICY)).toBe(0);
  });

  it('after the appointment started (negative hours): nothing', () => {
    expect(refundFor(1200, 4000, -1, KALOPSIA_POLICY)).toBe(0);
  });

  it('72 hours with keepOf "price": still the whole deposit', () => {
    expect(refundFor(1200, 4000, 72, { ...KALOPSIA_POLICY, keepOf: 'price' })).toBe(1200);
  });

  it('with keepOf "price": keeps a quarter of the price (returns 200)', () => {
    expect(refundFor(1200, 4000, 47, { ...KALOPSIA_POLICY, keepOf: 'price' })).toBe(200);
  });

  it('never returns less than 0 (price 8000, deposit 1200, keepOf "price")', () => {
    expect(refundFor(1200, 8000, 47, { ...KALOPSIA_POLICY, keepOf: 'price' })).toBe(0);
  });
});