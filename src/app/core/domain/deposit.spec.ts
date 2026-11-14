import { depositFor } from './deposit';

describe('depositFor', () => {
  it('30% of €40 is €12', () => {
    expect(depositFor(4000, 0.3)).toBe(1200);
  });

  it('rounds to the nearest cent', () => {
    expect(depositFor(3333, 0.3)).toBe(1000);
  });

  it('a price of 0 gives a deposit of 0', () => {
    expect(depositFor(0, 0.3)).toBe(0);
  });
  
  it('throws a RangeError when the rate is below 0', () => {
    expect(() => depositFor(4000, -0.3)).toThrow(RangeError);
  });

  it('throws a RangeError when the rate is above 1', () => {
    expect(() => depositFor(4000, 1.3)).toThrow(RangeError);
  });
});