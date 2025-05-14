import { Merchi } from '../merchi.js';

test('can make MenuItem', () => {
  const merchi = new Merchi();
  const menuItem = new merchi.MenuItem();
  expect(menuItem).toBeTruthy();
});
