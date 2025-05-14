import { Merchi } from '../merchi.js';

test('can make EmailCounter', () => {
  const merchi = new Merchi();
  const emailCounter = new merchi.EmailCounter();
  expect(emailCounter).toBeTruthy();
});
