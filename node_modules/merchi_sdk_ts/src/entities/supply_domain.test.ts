import { Merchi } from '../merchi.js';

test('can make SupplyDomain', () => {
  const merchi = new Merchi();
  const supplyDomain = new merchi.SupplyDomain();
  expect(supplyDomain).toBeTruthy();
});
