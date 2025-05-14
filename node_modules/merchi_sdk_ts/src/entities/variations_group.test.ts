import { Merchi } from '../merchi.js';

test('can make VariationsGroup', () => {
  const merchi = new Merchi();
  const variationsGroup = new merchi.VariationsGroup();
  expect(variationsGroup).toBeTruthy();
});
