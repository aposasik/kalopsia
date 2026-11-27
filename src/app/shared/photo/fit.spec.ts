import { fitWithin } from './fit';

describe('fitWithin', () => {
  it('a landscape photo: the width becomes the max', () => {
    expect(fitWithin(4000, 3000, 1280)).toEqual({ width: 1280, height: 960 });
  });

  it('a portrait selfie: the height becomes the max', () => {
    expect(fitWithin(3000, 4000, 1280)).toEqual({ width: 960, height: 1280 });
  });

  it('a small photo is never enlarged', () => {
    expect(fitWithin(800, 600, 1280)).toEqual({ width: 800, height: 600 });
  });

  it('rounds to whole pixels', () => {
    expect(fitWithin(1000, 333, 500)).toEqual({ width: 500, height: 167 });
  });
});