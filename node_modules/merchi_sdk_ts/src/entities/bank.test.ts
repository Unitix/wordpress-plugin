import { Merchi } from '../merchi.js';

test('can make Bank', () => {
  const merchi = new Merchi();
  const bank = new merchi.Bank();
  expect(bank).toBeTruthy();
});
