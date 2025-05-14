import { Merchi } from '../merchi.js';

test('can make Session', () => {
  const merchi = new Merchi();
  const session = new merchi.Session();
  expect(session).toBeTruthy();
});
