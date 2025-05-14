import { Merchi } from '../merchi.js';

test('can make Address', () => {
  const merchi = new Merchi();
  const address = new merchi.Address();
  expect(address).toBeTruthy();
});
